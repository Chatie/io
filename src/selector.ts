import {
  log,
}           from './config'

export class Selector<T extends Function> {

  constructor (
    public method: T,
  ) {
    log.verbose('Selector', 'constructor(%s)', method)
  }

}
