const lodash = require('lodash');
const colors = require('colors/safe'); // eslint-disable-line import/no-extraneous-dependencies

class TimeFlow {
  constructor({ size = 13, length = 16, interval = 1000 } = {}) {
    this.size = size;
    this.length = length;
    this.interval = interval;

    this._stop = true;
    this._countArray = lodash.range(this.size).map(() => 0);
    this._startTimestamp = undefined;
    this._lastTimestamp = undefined;
  }

  _timestamp() {
    const now = Date.now();
    const total = now - this._startTimestamp;
    const delta = now - (this._lastTimestamp || now);
    this._lastTimestamp = now;
    return `[${lodash.pad(total, 8)},${lodash.pad(delta, 8)}]`;
  }

  /*
   get a cell string with `pos` back ground color
   */
  _cell(pos, str, suffix = '', color = null) {
    const char = this._countArray[pos] ? colors.bgWhite(' ') : ' ';

    const empty = lodash.repeat(' ', this.length);
    str = lodash.truncate(`${str}${empty}`, { length: this.length, omission: `${suffix}` });
    str = lodash.padEnd(str, this.length, ' ');
    str = `${char}${str}${char}`;

    if (color) {
      str = colors[color](str);
    }

    return str;
  }

  /*
   gen a array of cell string
   */
  _array(str = ' ') {
    return lodash.range(this.size).map(pos => this._cell(pos, str));
  }

  async _drawLinesLoop(interval) {
    while (!this._stop) {
      const array = this._array(lodash.repeat('.', this.length));
      console.log(`${this._timestamp()}: ${array.join('|')} |`);
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }

  // ------------------------------------------------------
  /*
   print a line with timestamp and full cell in `pos` with `str`
   */
  print(pos, str, suffix = '', color = null) {
    if (!this._stop) {
      const array = this._array();
      array[pos] = this._cell(pos, str, suffix, color);
      console.log(`${this._timestamp()}: ${array.join('|')} |`);
    }
  }

  /**
   * decorate function `obj[key]`, and print it time flow in flow `pos`
   * @param {number} pos: flow blockIndex
   * @param {object} obj
   * @param {string} key
   * @param {function?} name: if set, gen print string by name(...args)
   */
  trace(pos, obj, key, name = undefined) {
    const func = obj[key].bind(obj);

    obj[key] = async (...args) => {
      const str = name ? name(...args) : key;

      this._countArray[pos] += 1;
      this.print(pos, str);

      const st = Date.now();
      try {
        const ret = await func(...args);
        this.print(pos, str, Date.now() - st, 'blue');
        this._countArray[pos] -= 1;
        return ret;
      } catch (e) {
        this.print(pos, str, Date.now() - st, 'red');
        this._countArray[pos] -= 1;
        throw e;
      }
    };
  }

  start() {
    this._stop = false;
    this._startTimestamp = Date.now();
    this._lastTimestamp = null;
    this._drawLinesLoop(this.interval).catch(() => {});
  }

  stop() {
    this._stop = true;
  }
}

module.exports = TimeFlow;
