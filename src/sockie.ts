/**
 * Making Use of WebSockets in Angular — Way Easier Than You Expected
 *  https://medium.com/briebug-blog/making-use-of-websockets-in-angular-way-easier-than-you-expected-25dd0061db1d
 */
import {
  Observer,
  Subject,
  BehaviorSubject,
  Subscribable,
  Unsubscribable,
  PartialObserver,
  Observable,
  of,
}                   from 'rxjs'
import {
  switchMap,
  retryWhen,
  delay,
  filter,
}                   from 'rxjs/operators'
import {
  WebSocketSubject,
  webSocket,
  WebSocketSubjectConfig,
}                   from 'rxjs/webSocket'

import ws, {
  CloseEvent,
  OpenEvent,
} from 'ws'

import {
  log,
}           from './config'

const RETRY_SECONDS = 1

export interface SockieOptions {
  url       : string,
  protocol? : string | string[],
}

/**
 * Naming conventions for observables
 *  https://angular.io/guide/rx-library#naming-conventions-for-observables
 */
export class Sockie<T extends Object> {

  public readonly url      : string
  public readonly protocol : undefined | string | string[]
  /**
   * Observers for the open/close/closing events
   */
  protected readonly openSubject$    : Subject<OpenEvent>
  protected readonly closeSubject$   : Subject<CloseEvent>
  protected readonly closingSubject$ : Subject<void>

  public get open$    () { return this.openSubject$.asObservable() }
  public get close$   () { return this.closeSubject$.asObservable() }
  public get closing$ () { return this.closingSubject$.asObservable() }

  /**
   * The RxJS WebSocketSubject
   */
  protected socket$: undefined | WebSocketSubject<T>

  constructor (
    options: string | SockieOptions,
  ) {
    log.verbose('Sockie', 'constructor("%s")', JSON.stringify(options))

    if (typeof options === 'string') {
      this.url = options
    } else {
      this.url      = options.url
      this.protocol = options.protocol
    }

    this.openSubject$    = new Subject<OpenEvent>()
    this.closeSubject$   = new Subject<CloseEvent>()
    this.closingSubject$ = new Subject<void>()
  }

  protected operatorSwitchMap () {
    return switchMap((url: string) => {
      if (this.socket$) {
        return this.socket$
      } else {
        const config = {
          WebSocketCtor: ws,

          closeObserver   : this.closeSubject$,
          closingObserver : this.closingSubject$,
          openObserver    : this.openSubject$,

          protocol: this.protocol,
          url,
        } as WebSocketSubjectConfig<T>

        this.socket$ = webSocket(config)

        return this.socket$
      }
    })
  }

  protected operatorRetryWhen () {
    return retryWhen<T>(
      errors => errors.pipe(delay(RETRY_SECONDS)),
    )

  //   .retryWhen(errors=>{
  //     return errors.delay(1000).scan((errorCount, err)=>{
  //         if(errorCount < 3) return errorCount + 1
  //         throw err
  //     }, 0)
  // })
  }

  /**
   *
   * Subscribable
   *
   */
  subscribe (
    observer?: PartialObserver<T>,
  ): Unsubscribable {
    const obs = of(this.url).pipe(
      this.operatorSwitchMap(),
      this.operatorRetryWhen(),
    )
    return obs.subscribe(observer)
  }

  // subscribeBak (): Unsubscribable {
  //   const obs = this.url$.pipe(
  //     switchMap(url => {
  //       if (this.socket$) {
  //         return this.socket$
  //       } else {
  //         const config = {
  //           WebSocketCtor: ws,

  //           closeObserver   : this.closeSubject$,
  //           closingObserver : this.closingSubject$,
  //           openObserver    : this.openSubject$,

  //           protocol: this.protocol$.getValue(),
  //           url,
  //         } as WebSocketSubjectConfig<T>

  //         this.socket$ = webSocket(config)

  //         return this.socket$
  //       }
  //     }),
  //     retryWhen((errors) => errors.pipe(delay(RETRY_SECONDS)))
  //   )
  //   return obs.subscribe(...arguments)
  // }

  send (data: T) {
    if (this.socket$) {
      this.socket$.next(data)
    } else {
      throw new Error('no connection')
    }
  }

  close (error?: string) {
    if (this.socket$) {
      if (error) {
        this.socket$.error(error)
      } // else complete ???
      this.socket$.complete()

      this.socket$ = undefined
    }

    this.cleanCallbackList.forEach(cb => cb())
    this.cleanCallbackList = []
  }

  /**
   *
   * Streaming APIs
   *
   */
  public pipe<S extends NodeJS.WritableStream> (
    destination: S,
    options?: {
      end?: boolean;
    },
  ): S {
    log.verbose('Sockie', 'pipe(%s)', destination)

    const next     = (value: T) => destination.write(JSON.stringify(value))
    const error    = (err: any) => destination.emit('error', err)
    const complete = () => {
      if (options && options.end !== false) {
        destination.end()
      }
    }

    const observer = { complete, error, next } as Observer<T>

    const sub = this.connect().subscribe(observer)
    this.cleanCallbackList.push(
      () => sub.unsubscribe(),
    )

    return destination
  }


}

destroyed$ = new Subject();
this.webSocket.connect().pipe(
  takeUntil(this.destroyed$)
).subscribe(messages => this.messages.push(messages));
this.destroyed$.next();
