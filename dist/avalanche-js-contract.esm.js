import { checkNormalize, arrayify, hexlify, concat, throwError, INVALID_ARGUMENT, checkNew, BN, padZeros, bytesPadRight, checkArgumentCount, toChecksumAddress, keccak256, getAddress, isHexString } from 'avalanche-js-crypto';
import { defineReadOnly, hexToBN, isObject, isArray, Unit, isString, numberToHex, isAddress } from 'avalanche-js-utils';
import { Wallet } from 'avalanche-js-account';
import _regeneratorRuntime from 'regenerator-runtime';
import { TransactionFactory, TxStatus } from 'avalanche-js-transaction';
import { getResultForData, RPCMethod, LogSub } from 'avalanche-js-network';

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) {
  try {
    var info = gen[key](arg);
    var value = info.value;
  } catch (error) {
    reject(error);
    return;
  }

  if (info.done) {
    resolve(value);
  } else {
    Promise.resolve(value).then(_next, _throw);
  }
}

function _asyncToGenerator(fn) {
  return function () {
    var self = this,
        args = arguments;
    return new Promise(function (resolve, reject) {
      var gen = fn.apply(self, args);

      function _next(value) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value);
      }

      function _throw(err) {
        asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err);
      }

      _next(undefined);
    });
  };
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ("value" in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  Object.defineProperty(Constructor, "prototype", {
    writable: false
  });
  return Constructor;
}

function _extends() {
  _extends = Object.assign || function (target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i];

      for (var key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          target[key] = source[key];
        }
      }
    }

    return target;
  };

  return _extends.apply(this, arguments);
}

function _inheritsLoose(subClass, superClass) {
  subClass.prototype = Object.create(superClass.prototype);
  subClass.prototype.constructor = subClass;

  _setPrototypeOf(subClass, superClass);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
    o.__proto__ = p;
    return o;
  };

  return _setPrototypeOf(o, p);
}

/** @hidden */

var NegativeAVAX = /*#__PURE__*/new BN(-1);
/** @hidden */

var AVAX = /*#__PURE__*/new BN(1);
/** @hidden */

var Zero = /*#__PURE__*/new BN(0);
/** @hidden */

var HashZero = '0x0000000000000000000000000000000000000000000000000000000000000000';
/** @hidden */

var MaxUint256 = /*#__PURE__*/hexToBN('0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff'); ///////////////////////////////

/** @hidden */

var paramTypeBytes = /*#__PURE__*/new RegExp(/^bytes([0-9]*)$/);
/** @hidden */

var paramTypeNumber = /*#__PURE__*/new RegExp(/^(u?int)([0-9]*)$/);
/** @hidden */

var paramTypeArray = /*#__PURE__*/new RegExp(/^(.*)\[([0-9]*)\]$/);
/** @hidden */

var defaultCoerceFunc = function defaultCoerceFunc(type, value) {
  var match = type.match(paramTypeNumber);

  if (match && parseInt(match[2], 10) <= 48) {
    // return value.toNumber();
    return value.toString('hex');
  }

  return value;
}; ///////////////////////////////////
/** @hidden */

function verifyType(type) {
  // These need to be transformed to their full description
  if (type.match(/^uint($|[^1-9])/)) {
    type = 'uint256' + type.substring(4);
  } else if (type.match(/^int($|[^1-9])/)) {
    type = 'int256' + type.substring(3);
  }

  return type;
}
/** @hidden */


function parseParam(param, allowIndexed) {
  var originalParam = param; // tslint:disable-next-line: no-shadowed-variable

  function throwError(i) {
    throw new Error('unexpected character "' + originalParam[i] + '" at position ' + i + ' in "' + originalParam + '"');
  }

  param = param.replace(/\s/g, ' ');
  var parent = {
    type: '',
    name: '',
    state: {
      allowType: true
    }
  };
  var node = parent;

  for (var i = 0; i < param.length; i++) {
    var c = param[i];

    switch (c) {
      case '(':
        if (!node.state || !node.state.allowParams) {
          throwError(i);
        }

        if (node.state) {
          node.state.allowType = false;
        }

        if (node.type) {
          node.type = verifyType(node.type);
        }

        node.components = [{
          type: '',
          name: '',
          parent: node,
          state: {
            allowType: true
          }
        }];
        node = node.components[0];
        break;

      case ')':
        delete node.state;

        if (allowIndexed && node.name === 'indexed') {
          node.indexed = true;
          node.name = '';
        }

        if (node.type) {
          node.type = verifyType(node.type);
        }

        var child = node;
        node = node.parent;

        if (!node) {
          throwError(i);
        }

        delete child.parent;

        if (node.state) {
          node.state.allowParams = false;
          node.state.allowName = true;
          node.state.allowArray = true;
        }

        break;

      case ',':
        delete node.state;

        if (allowIndexed && node.name === 'indexed') {
          node.indexed = true;
          node.name = '';
        }

        if (node.type) {
          node.type = verifyType(node.type);
        }

        var sibling = {
          type: '',
          name: '',
          parent: node.parent,
          state: {
            allowType: true
          }
        };
        node.parent.components.push(sibling);
        delete node.parent;
        node = sibling;
        break;
      // Hit a space...

      case ' ':
        // If reading type, the type is done and may read a param or name
        if (node.state) {
          if (node.state.allowType) {
            if (node.type !== '' && node.type) {
              node.type = verifyType(node.type);
              delete node.state.allowType;
              node.state.allowName = true;
              node.state.allowParams = true;
            }
          } // If reading name, the name is done


          if (node.state.allowName) {
            if (node.name !== '') {
              if (allowIndexed && node.name === 'indexed') {
                node.indexed = true;
                node.name = '';
              } else {
                node.state.allowName = false;
              }
            }
          }
        }

        break;

      case '[':
        if (!node.state || !node.state.allowArray) {
          throwError(i);
        }

        if (node.state) {
          node.type += c;
          node.state.allowArray = false;
          node.state.allowName = false;
          node.state.readArray = true;
        }

        break;

      case ']':
        if (!node.state || !node.state.readArray) {
          throwError(i);
        }

        if (node.state) {
          node.type += c;
          node.state.readArray = false;
          node.state.allowArray = true;
          node.state.allowName = true;
        }

        break;

      default:
        if (node.state) {
          if (node.state.allowType) {
            node.type += c;
            node.state.allowParams = true;
            node.state.allowArray = true;
          } else if (node.state.allowName) {
            node.name += c;
            delete node.state.allowArray;
          } else if (node.state.readArray) {
            node.type += c;
          } else {
            throwError(i);
          }
        }

    }
  }

  if (node.parent) {
    throw new Error('unexpected eof');
  }

  delete parent.state;

  if (allowIndexed && node.name === 'indexed') {
    node.indexed = true;
    node.name = '';
  }

  if (parent.type) {
    parent.type = verifyType(parent.type);
  }

  return parent;
} // @TODO: Better return type
/** @hidden */

var Coder = function Coder(coerceFunc, name, type, localName, dynamic) {
  this.coerceFunc = coerceFunc;
  this.name = name;
  this.type = type;
  this.localName = localName;
  this.dynamic = dynamic;
}; // Clones the functionality of an existing Coder, but without a localName
// tslint:disable-next-line: max-classes-per-file

/** @hidden */


var CoderAnonymous = /*#__PURE__*/function (_Coder) {
  _inheritsLoose(CoderAnonymous, _Coder);

  function CoderAnonymous(coder) {
    var _this;

    _this = _Coder.call(this, coder.coerceFunc, coder.name, coder.type, undefined, coder.dynamic) || this;
    _this.coder = coder;
    return _this;
  }

  var _proto = CoderAnonymous.prototype;

  _proto.encode = function encode(value) {
    return this.coder.encode(value);
  };

  _proto.decode = function decode(data, offset) {
    return this.coder.decode(data, offset);
  };

  return CoderAnonymous;
}(Coder); // tslint:disable-next-line: max-classes-per-file

/** @hidden */


var CoderNull = /*#__PURE__*/function (_Coder2) {
  _inheritsLoose(CoderNull, _Coder2);

  function CoderNull(coerceFunc, localName) {
    return _Coder2.call(this, coerceFunc, 'null', '', localName, false) || this;
  }

  var _proto2 = CoderNull.prototype;

  _proto2.encode = function encode(value) {
    var result = arrayify([]) || new Uint8Array();
    return result;
  };

  _proto2.decode = function decode(data, offset) {
    if (offset > data.length) {
      throw new Error('invalid null');
    }

    return {
      consumed: 0,
      value: this.coerceFunc('null', undefined)
    };
  };

  return CoderNull;
}(Coder); // tslint:disable-next-line: max-classes-per-file

/** @hidden */


var CoderNumber = /*#__PURE__*/function (_Coder3) {
  _inheritsLoose(CoderNumber, _Coder3);

  function CoderNumber(coerceFunc, size, signed, localName) {
    var _this2;

    var name = (signed ? 'int' : 'uint') + size * 8;
    _this2 = _Coder3.call(this, coerceFunc, name, name, localName, false) || this;
    _this2.size = size;
    _this2.signed = signed;
    return _this2;
  }

  var _proto3 = CoderNumber.prototype;

  _proto3.encode = function encode(value) {
    var result;

    try {
      var v;

      if (typeof value == 'string' && value.startsWith('0x')) {
        v = new BN(value.slice(2), 'hex');
      } else {
        v = new BN(value);
      }

      if (this.signed) {
        var bounds = MaxUint256.maskn(this.size * 8 - 1);

        if (v.gt(bounds)) {
          throw new Error('out-of-bounds');
        }

        bounds = bounds.add(AVAX).mul(NegativeAVAX);

        if (v.lt(bounds)) {
          throw new Error('out-of-bounds');
        }
      } else if (v.lt(Zero) || v.gt(MaxUint256.maskn(this.size * 8))) {
        throw new Error('out-of-bounds');
      }

      v = v.toTwos(this.size * 8).maskn(this.size * 8);

      if (this.signed) {
        v = v.fromTwos(this.size * 8).toTwos(256);
      }

      var vString = v.toString('hex');
      result = padZeros(arrayify("0x" + vString) || new Uint8Array(), 32);
    } catch (error) {
      throwError('invalid number value', INVALID_ARGUMENT, {
        arg: this.localName,
        coderType: this.name,
        value: value
      });
    }

    return result || padZeros(new Uint8Array(), 32);
  };

  _proto3.decode = function decode(data, offset) {
    if (data.length < offset + 32) {
      throwError('insufficient data for ' + this.name + ' type', INVALID_ARGUMENT, {
        arg: this.localName,
        coderType: this.name,
        value: hexlify(data.slice(offset, offset + 32))
      });
    }

    var junkLength = 32 - this.size;
    var dataValue = hexlify(data.slice(offset + junkLength, offset + 32));
    var value = hexToBN(dataValue); // tslint:disable-next-line: prefer-conditional-expression

    if (this.signed) {
      value = value.fromTwos(this.size * 8);
    } else {
      value = value.maskn(this.size * 8);
    }

    return {
      consumed: 32,
      value: this.coerceFunc(this.name, value)
    };
  };

  return CoderNumber;
}(Coder);
/** @hidden */


var uint256Coder = /*#__PURE__*/new CoderNumber(function (type, value) {
  return value;
}, 32, false, 'none'); // tslint:disable-next-line: max-classes-per-file

/** @hidden */

var CoderBoolean = /*#__PURE__*/function (_Coder4) {
  _inheritsLoose(CoderBoolean, _Coder4);

  function CoderBoolean(coerceFunc, localName) {
    return _Coder4.call(this, coerceFunc, 'bool', 'bool', localName, false) || this;
  }

  var _proto4 = CoderBoolean.prototype;

  _proto4.encode = function encode(value) {
    return uint256Coder.encode(!!value ? new BN(1) : new BN(0));
  };

  _proto4.decode = function decode(data, offset) {
    var result;

    try {
      result = uint256Coder.decode(data, offset);
    } catch (error) {
      if (error.reason === 'insufficient data for uint256 type') {
        throwError('insufficient data for boolean type', INVALID_ARGUMENT, {
          arg: this.localName,
          coderType: 'boolean',
          value: error.value
        });
      }

      throw error;
    }

    return {
      consumed: result.consumed,
      value: this.coerceFunc('bool', !result.value.isZero())
    };
  };

  return CoderBoolean;
}(Coder); // tslint:disable-next-line: max-classes-per-file

/** @hidden */


var CoderFixedBytes = /*#__PURE__*/function (_Coder5) {
  _inheritsLoose(CoderFixedBytes, _Coder5);

  function CoderFixedBytes(coerceFunc, length, localName) {
    var _this3;

    var name = 'bytes' + length;
    _this3 = _Coder5.call(this, coerceFunc, name, name, localName, false) || this;
    _this3.length = length;
    return _this3;
  }

  var _proto5 = CoderFixedBytes.prototype;

  _proto5.encode = function encode(value) {
    var result = new Uint8Array(this.length);

    try {
      var arrayied = arrayify(value);
      var data = null;

      if (arrayied !== null) {
        var valueToByte = hexlify(arrayied);
        data = arrayify(bytesPadRight(valueToByte, this.length));
      } else {
        throw new Error('cannot arraify data');
      }

      if (data === null || data.length !== this.length) {
        throw new Error('incorrect data length');
      }

      result.set(data);
    } catch (error) {
      throwError('invalid ' + this.name + ' value', INVALID_ARGUMENT, {
        arg: this.localName,
        coderType: this.name,
        value: error.value || value
      });
    }

    return result;
  };

  _proto5.decode = function decode(data, offset) {
    if (data.length < offset + 32) {
      throwError('insufficient data for ' + name + ' type', INVALID_ARGUMENT, {
        arg: this.localName,
        coderType: this.name,
        value: hexlify(data.slice(offset, offset + 32))
      });
    }

    return {
      consumed: 32,
      value: this.coerceFunc(this.name, hexlify(data.slice(offset, offset + this.length)))
    };
  };

  return CoderFixedBytes;
}(Coder); // tslint:disable-next-line: max-classes-per-file

/** @hidden */


var CoderAddress = /*#__PURE__*/function (_Coder6) {
  _inheritsLoose(CoderAddress, _Coder6);

  function CoderAddress(coerceFunc, localName) {
    return _Coder6.call(this, coerceFunc, 'address', 'address', localName, false) || this;
  }

  var _proto6 = CoderAddress.prototype;

  _proto6.encode = function encode(value) {
    var result = new Uint8Array(32);

    try {
      var addr = arrayify(toChecksumAddress(value)) || new Uint8Array();
      result.set(addr, 12);
    } catch (error) {
      throwError('invalid address', INVALID_ARGUMENT, {
        arg: this.localName,
        coderType: 'address',
        value: value
      });
    }

    return result;
  };

  _proto6.decode = function decode(data, offset) {
    if (data.length < offset + 32) {
      throwError('insufficuent data for address type', INVALID_ARGUMENT, {
        arg: this.localName,
        coderType: 'address',
        value: hexlify(data.slice(offset, offset + 32))
      });
    }

    return {
      consumed: 32,
      value: this.coerceFunc('address', toChecksumAddress(hexlify(data.slice(offset + 12, offset + 32))))
    };
  };

  return CoderAddress;
}(Coder);
/** @hidden */


function _encodeDynamicBytes(value) {
  var dataLength = 32 * Math.ceil(value.length / 32);
  var padding = new Uint8Array(dataLength - value.length);
  return concat([uint256Coder.encode(new BN(value.length)), value, padding]);
}
/** @hidden */


function _decodeDynamicBytes(data, offset, localName) {
  if (data.length < offset + 32) {
    throwError('insufficient data for dynamicBytes length', INVALID_ARGUMENT, {
      arg: localName,
      coderType: 'dynamicBytes',
      value: hexlify(data.slice(offset, offset + 32))
    });
  }

  var length = uint256Coder.decode(data, offset).value;

  try {
    length = length.toNumber();
  } catch (error) {
    throwError('dynamic bytes count too large', INVALID_ARGUMENT, {
      arg: localName,
      coderType: 'dynamicBytes',
      value: length.toString()
    });
  }

  if (data.length < offset + 32 + length) {
    throwError('insufficient data for dynamicBytes type', INVALID_ARGUMENT, {
      arg: localName,
      coderType: 'dynamicBytes',
      value: hexlify(data.slice(offset, offset + 32 + length))
    });
  }

  return {
    consumed: 32 + 32 * Math.ceil(length / 32),
    value: data.slice(offset + 32, offset + 32 + length)
  };
} // tslint:disable-next-line: max-classes-per-file

/** @hidden */


var CoderDynamicBytes = /*#__PURE__*/function (_Coder7) {
  _inheritsLoose(CoderDynamicBytes, _Coder7);

  function CoderDynamicBytes(coerceFunc, localName) {
    return _Coder7.call(this, coerceFunc, 'bytes', 'bytes', localName, true) || this;
  }

  var _proto7 = CoderDynamicBytes.prototype;

  _proto7.encode = function encode(value) {
    var result = new Uint8Array();

    try {
      result = _encodeDynamicBytes(arrayify(value) || new Uint8Array());
    } catch (error) {
      throwError('invalid bytes value', INVALID_ARGUMENT, {
        arg: this.localName,
        coderType: 'bytes',
        value: error.value
      });
    }

    return result;
  };

  _proto7.decode = function decode(data, offset) {
    var result = _decodeDynamicBytes(data, offset, this.localName || '');

    result.value = this.coerceFunc('bytes', hexlify(result.value));
    return result;
  };

  return CoderDynamicBytes;
}(Coder); // tslint:disable-next-line: max-classes-per-file

/** @hidden */


var CoderString = /*#__PURE__*/function (_Coder8) {
  _inheritsLoose(CoderString, _Coder8);

  function CoderString(coerceFunc, localName) {
    return _Coder8.call(this, coerceFunc, 'string', 'string', localName, true) || this;
  }

  var _proto8 = CoderString.prototype;

  _proto8.encode = function encode(value) {
    if (typeof value !== 'string') {
      throwError('invalid string value', INVALID_ARGUMENT, {
        arg: this.localName,
        coderType: 'string',
        value: value
      });
    }

    return _encodeDynamicBytes(toUtf8Bytes(value));
  };

  _proto8.decode = function decode(data, offset) {
    var result = _decodeDynamicBytes(data, offset, this.localName || '');

    result.value = this.coerceFunc('string', toUtf8String(result.value));
    return result;
  };

  return CoderString;
}(Coder);
/** @hidden */


function alignSize(size) {
  return 32 * Math.ceil(size / 32);
}
/** @hidden */


function pack(coders, values) {
  if (Array.isArray(values)) ; else if (values && typeof values === 'object') {
    var arrayValues = [];
    coders.forEach(function (coder) {
      arrayValues.push(values[coder.localName || '']);
    });
    values = arrayValues;
  } else {
    throwError('invalid tuple value', INVALID_ARGUMENT, {
      coderType: 'tuple',
      value: values
    });
  }

  if (coders.length !== values.length) {
    throwError('types/value length mismatch', INVALID_ARGUMENT, {
      coderType: 'tuple',
      value: values
    });
  }

  var parts = [];
  coders.forEach(function (coder, index) {
    parts.push({
      dynamic: coder.dynamic,
      value: coder.encode(values[index])
    });
  });
  var staticSize = 0;
  var dynamicSize = 0;
  parts.forEach(function (part) {
    if (part.dynamic) {
      staticSize += 32;
      dynamicSize += alignSize(part.value.length);
    } else {
      staticSize += alignSize(part.value.length); // todo : is it to be static size not alignSize?
    }
  });
  var offset = 0;
  var dynamicOffset = staticSize;
  var data = new Uint8Array(staticSize + dynamicSize);
  parts.forEach(function (part) {
    if (part.dynamic) {
      // uint256Coder.encode(dynamicOffset).copy(data, offset);
      data.set(uint256Coder.encode(new BN(dynamicOffset)), offset);
      offset += 32; // part.value.copy(data, dynamicOffset);  @TODO

      data.set(part.value, dynamicOffset);
      dynamicOffset += alignSize(part.value.length);
    } else {
      // part.value.copy(data, offset);  @TODO
      data.set(part.value, offset);
      offset += alignSize(part.value.length);
    }
  });
  return data;
}
/** @hidden */


function unpack(coders, data, offset) {
  var baseOffset = offset;
  var consumed = 0;
  var value = [];
  coders.forEach(function (coder) {
    var result;

    if (coder.dynamic) {
      var dynamicOffset = uint256Coder.decode(data, offset);
      result = coder.decode(data, baseOffset + dynamicOffset.value.toNumber()); // The dynamic part is leap-frogged somewhere else; doesn't count towards size

      result.consumed = dynamicOffset.consumed;
    } else {
      result = coder.decode(data, offset);
    }

    if (result.value !== undefined) {
      value.push(result.value);
    }

    offset += result.consumed;
    consumed += result.consumed;
  });
  coders.forEach(function (coder, index) {
    var name = coder.localName;

    if (!name) {
      return;
    }

    if (name === 'length') {
      name = '_length';
    }

    if (value[name] != null) {
      return;
    }

    value[name] = value[index];
  });
  return {
    value: value,
    consumed: consumed
  };
} // tslint:disable-next-line: max-classes-per-file

/** @hidden */


var CoderArray = /*#__PURE__*/function (_Coder9) {
  _inheritsLoose(CoderArray, _Coder9);

  function CoderArray(coerceFunc, coder, length, localName) {
    var _this4;

    var type = coder.type + '[' + (length >= 0 ? length : '') + ']';
    var dynamic = length === -1 || coder.dynamic;
    _this4 = _Coder9.call(this, coerceFunc, 'array', type, localName, dynamic) || this;
    _this4.coder = coder;
    _this4.length = length;
    return _this4;
  }

  var _proto9 = CoderArray.prototype;

  _proto9.encode = function encode(value) {
    if (!Array.isArray(value)) {
      throwError('expected array value', INVALID_ARGUMENT, {
        arg: this.localName,
        coderType: 'array',
        value: value
      });
    }

    var count = this.length;
    var result = new Uint8Array(0);

    if (count === -1) {
      count = value.length;
      result = uint256Coder.encode(new BN(count));
    }

    checkArgumentCount(count, value.length, ' in coder array' + (this.localName ? ' ' + this.localName : ''));
    var coders = []; // tslint:disable-next-line: prefer-for-of

    for (var i = 0; i < value.length; i++) {
      coders.push(this.coder);
    }

    return concat([result, pack(coders, value)]);
  };

  _proto9.decode = function decode(data, offset) {
    // @TODO:
    // if (data.length < offset + length * 32) { throw new Error('invalid array'); }
    var consumed = 0;
    var count = this.length;
    var decodedLength = {
      consumed: 0,
      value: undefined
    };

    if (count === -1) {
      try {
        decodedLength = uint256Coder.decode(data, offset);
      } catch (error) {
        throwError('insufficient data for dynamic array length', INVALID_ARGUMENT, {
          arg: this.localName,
          coderType: 'array',
          value: error.value
        });
      }

      try {
        count = decodedLength.value.toNumber();
      } catch (error) {
        throwError('array count too large', INVALID_ARGUMENT, {
          arg: this.localName,
          coderType: 'array',
          value: decodedLength.value.toString()
        });
      }

      consumed += decodedLength.consumed;
      offset += decodedLength.consumed;
    }

    var coders = [];

    for (var i = 0; i < count; i++) {
      coders.push(new CoderAnonymous(this.coder));
    }

    var result = unpack(coders, data, offset);
    result.consumed += consumed;
    result.value = this.coerceFunc(this.type, result.value);
    return result;
  };

  return CoderArray;
}(Coder); // tslint:disable-next-line: max-classes-per-file

/** @hidden */


var CoderTuple = /*#__PURE__*/function (_Coder10) {
  _inheritsLoose(CoderTuple, _Coder10);

  function CoderTuple(coerceFunc, coders, localName) {
    var _this5;

    var dynamic = false;
    var types = [];
    coders.forEach(function (coder) {
      if (coder.dynamic) {
        dynamic = true;
      }

      types.push(coder.type);
    });
    var type = 'tuple(' + types.join(',') + ')';
    _this5 = _Coder10.call(this, coerceFunc, 'tuple', type, localName, dynamic) || this;
    _this5.coders = coders;
    return _this5;
  }

  var _proto10 = CoderTuple.prototype;

  _proto10.encode = function encode(value) {
    return pack(this.coders, value);
  };

  _proto10.decode = function decode(data, offset) {
    var result = unpack(this.coders, data, offset);
    result.value = this.coerceFunc(this.type, result.value);
    return result;
  };

  return CoderTuple;
}(Coder);

/** @hidden */


var paramTypeSimple = {
  address: CoderAddress,
  bool: CoderBoolean,
  string: CoderString,
  bytes: CoderDynamicBytes
};
/** @hidden */

function getTupleParamCoder(coerceFunc, components, localName) {
  if (!components) {
    components = [];
  }

  var coders = [];
  components.forEach(function (component) {
    coders.push(getParamCoder(coerceFunc, component));
  });
  return new CoderTuple(coerceFunc, coders, localName);
}
/** @hidden */


function getParamCoder(coerceFunc, param) {
  var coder = paramTypeSimple[param.type];

  if (coder) {
    return new coder(coerceFunc, param.name);
  }

  var matcher = param.type.match(paramTypeNumber);

  if (matcher) {
    var size = parseInt(matcher[2] || '256', 10);

    if (size === 0 || size > 256 || size % 8 !== 0) {
      throwError('invalid ' + matcher[1] + ' bit length', INVALID_ARGUMENT, {
        arg: 'param',
        value: param
      });
    }

    return new CoderNumber(coerceFunc, size / 8, matcher[1] === 'int', param.name || '');
  }

  var matcher2 = param.type.match(paramTypeBytes);

  if (matcher2) {
    var _size = parseInt(matcher2[1], 10);

    if (_size === 0 || _size > 32) {
      throwError('invalid bytes length', INVALID_ARGUMENT, {
        arg: 'param',
        value: param
      });
    }

    return new CoderFixedBytes(coerceFunc, _size, param.name || '');
  }

  var matcher3 = param.type.match(paramTypeArray);

  if (matcher3) {
    var _size2 = parseInt(matcher3[2] || '-1', 10);

    param = shallowCopy(param);
    param.type = matcher3[1];
    param = deepCopy(param);
    return new CoderArray(coerceFunc, getParamCoder(coerceFunc, param), _size2, param.name || '');
  }

  if (param.type.substring(0, 5) === 'tuple') {
    return getTupleParamCoder(coerceFunc, param.components || [], param.name || '');
  }

  if (param.type === '') {
    return new CoderNull(coerceFunc, param.name || '');
  }

  throwError('invalid type', INVALID_ARGUMENT, {
    arg: 'type',
    value: param.type
  });
}
/** @hidden */


var UnicodeNormalizationForm;

(function (UnicodeNormalizationForm) {
  UnicodeNormalizationForm["current"] = "";
  UnicodeNormalizationForm["NFC"] = "NFC";
  UnicodeNormalizationForm["NFD"] = "NFD";
  UnicodeNormalizationForm["NFKC"] = "NFKC";
  UnicodeNormalizationForm["NFKD"] = "NFKD";
})(UnicodeNormalizationForm || (UnicodeNormalizationForm = {}));
/** @hidden */


function toUtf8Bytes(str, form) {
  if (form === void 0) {
    form = UnicodeNormalizationForm.current;
  }

  if (form !== UnicodeNormalizationForm.current) {
    checkNormalize();
    str = str.normalize(form);
  }

  var result = [];

  for (var i = 0; i < str.length; i++) {
    var c = str.charCodeAt(i);

    if (c < 0x80) {
      result.push(c);
    } else if (c < 0x800) {
      result.push(c >> 6 | 0xc0);
      result.push(c & 0x3f | 0x80);
    } else if ((c & 0xfc00) === 0xd800) {
      i++;
      var c2 = str.charCodeAt(i);

      if (i >= str.length || (c2 & 0xfc00) !== 0xdc00) {
        throw new Error('invalid utf-8 string');
      } // Surrogate Pair


      c = 0x10000 + ((c & 0x03ff) << 10) + (c2 & 0x03ff);
      result.push(c >> 18 | 0xf0);
      result.push(c >> 12 & 0x3f | 0x80);
      result.push(c >> 6 & 0x3f | 0x80);
      result.push(c & 0x3f | 0x80);
    } else {
      result.push(c >> 12 | 0xe0);
      result.push(c >> 6 & 0x3f | 0x80);
      result.push(c & 0x3f | 0x80);
    }
  }

  return arrayify(result) || new Uint8Array();
} // http://stackoverflow.com/questions/13356493/decode-utf-8-with-javascript#13691499

/** @hidden */

function toUtf8String(bytes, ignoreErrors) {
  bytes = arrayify(bytes) || new Uint8Array();
  var result = '';
  var i = 0; // Invalid bytes are ignored

  while (i < bytes.length) {
    var c = bytes[i++]; // 0xxx xxxx

    if (c >> 7 === 0) {
      result += String.fromCharCode(c);
      continue;
    } // Multibyte; how many bytes left for this character?


    var extraLength = null;
    var overlongMask = null; // 110x xxxx 10xx xxxx

    if ((c & 0xe0) === 0xc0) {
      extraLength = 1;
      overlongMask = 0x7f; // 1110 xxxx 10xx xxxx 10xx xxxx
    } else if ((c & 0xf0) === 0xe0) {
      extraLength = 2;
      overlongMask = 0x7ff; // 1111 0xxx 10xx xxxx 10xx xxxx 10xx xxxx
    } else if ((c & 0xf8) === 0xf0) {
      extraLength = 3;
      overlongMask = 0xffff;
    } else {
      if (!ignoreErrors) {
        if ((c & 0xc0) === 0x80) {
          throw new Error('invalid utf8 byte sequence; unexpected continuation byte');
        }

        throw new Error('invalid utf8 byte sequence; invalid prefix');
      }

      continue;
    } // Do we have enough bytes in our data?


    if (i + extraLength > bytes.length) {
      if (!ignoreErrors) {
        throw new Error('invalid utf8 byte sequence; too short');
      } // If there is an invalid unprocessed byte, skip continuation bytes


      for (; i < bytes.length; i++) {
        if (bytes[i] >> 6 !== 0x02) {
          break;
        }
      }

      continue;
    } // Remove the length prefix from the char


    var res = c & (1 << 8 - extraLength - 1) - 1;

    for (var j = 0; j < extraLength; j++) {
      var nextChar = bytes[i]; // Invalid continuation byte

      if ((nextChar & 0xc0) !== 0x80) {
        res = null;
        break;
      }

      res = res << 6 | nextChar & 0x3f;
      i++;
    }

    if (res === null) {
      if (!ignoreErrors) {
        throw new Error('invalid utf8 byte sequence; invalid continuation byte');
      }

      continue;
    } // Check for overlong seuences (more bytes than needed)


    if (res <= overlongMask) {
      if (!ignoreErrors) {
        throw new Error('invalid utf8 byte sequence; overlong');
      }

      continue;
    } // Maximum code point


    if (res > 0x10ffff) {
      if (!ignoreErrors) {
        throw new Error('invalid utf8 byte sequence; out-of-range');
      }

      continue;
    } // Reserved for UTF-16 surrogate halves


    if (res >= 0xd800 && res <= 0xdfff) {
      if (!ignoreErrors) {
        throw new Error('invalid utf8 byte sequence; utf-16 surrogate');
      }

      continue;
    }

    if (res <= 0xffff) {
      result += String.fromCharCode(res);
      continue;
    }

    res -= 0x10000;
    result += String.fromCharCode((res >> 10 & 0x3ff) + 0xd800, (res & 0x3ff) + 0xdc00);
  }

  return result;
}
/** @hidden */

function formatBytes32String(text) {
  // Get the bytes
  var bytes = toUtf8Bytes(text); // Check we have room for null-termination

  if (bytes.length > 31) {
    throw new Error('bytes32 string must be less than 32 bytes');
  } // Zero-pad (implicitly null-terminates)


  return hexlify(concat([bytes, HashZero]).slice(0, 32));
}
/** @hidden */

function parseBytes32String(bytes) {
  var data = arrayify(bytes) || new Uint8Array(); // Must be 32 bytes with a null-termination

  if (data.length !== 32) {
    throw new Error('invalid bytes32 - not 32 bytes long');
  }

  if (data[31] !== 0) {
    throw new Error('invalid bytes32 sdtring - no null terminator');
  } // Find the null termination


  var length = 31;

  while (data[length - 1] === 0) {
    length--;
  } // Determine the string value


  return toUtf8String(data.slice(0, length));
}
/** @hidden */

function isType(object, type) {
  return object && object._ethersType === type;
}
/** @hidden */

function shallowCopy(object) {
  var result = {}; // tslint:disable-next-line: forin

  for (var key in object) {
    result[key] = object[key];
  }

  return result;
}
/** @hidden */

var opaque = {
  "boolean": true,
  number: true,
  string: true
};
/** @hidden */

function deepCopy(object, frozen) {
  // Opaque objects are not mutable, so safe to copy by assignment
  if (object === undefined || object === null || opaque[typeof object]) {
    return object;
  } // Arrays are mutable, so we need to create a copy


  if (Array.isArray(object)) {
    var result = object.map(function (item) {
      return deepCopy(item, frozen);
    });

    if (frozen) {
      Object.freeze(result);
    }

    return result;
  }

  if (typeof object === 'object') {
    // Some internal objects, which are already immutable
    if (isType(object, 'BigNumber')) {
      return object;
    }

    if (isType(object, 'Description')) {
      return object;
    }

    if (isType(object, 'Indexed')) {
      return object;
    }

    var _result = {}; // tslint:disable-next-line: forin

    for (var key in object) {
      var value = object[key];

      if (value === undefined) {
        continue;
      }

      defineReadOnly(_result, key, deepCopy(value, frozen));
    }

    if (frozen) {
      Object.freeze(_result);
    }

    return _result;
  } // The function type is also immutable, so safe to copy by assignment


  if (typeof object === 'function') {
    return object;
  }

  throw new Error('Cannot deepCopy ' + typeof object);
} // tslint:disable-next-line: max-classes-per-file

/** @hidden */

var AbiCoder = /*#__PURE__*/function () {
  function AbiCoder(coerceFunc) {
    checkNew(this, AbiCoder);

    if (!coerceFunc) {
      coerceFunc = defaultCoerceFunc;
    }

    this.coerceFunc = coerceFunc;
  }

  var _proto11 = AbiCoder.prototype;

  _proto11.encode = function encode(types, values) {
    var _this6 = this;

    if (types.length !== values.length) {
      throwError('types/values length mismatch', INVALID_ARGUMENT, {
        count: {
          types: types.length,
          values: values.length
        },
        value: {
          types: types,
          values: values
        }
      });
    }

    var coders = [];
    types.forEach(function (type) {
      // Convert types to type objects
      //   - "uint foo" => { type: "uint", name: "foo" }
      //   - "tuple(uint, uint)" => { type: "tuple", components: [ { type: "uint" }, { type: "uint" }, ] }
      var typeObject = null; // tslint:disable-next-line: prefer-conditional-expression

      if (typeof type === 'string') {
        typeObject = parseParam(type);
      } else {
        typeObject = type;
      }

      coders.push(getParamCoder(_this6.coerceFunc, typeObject));
    }, this);
    var encodedArray = new CoderTuple(this.coerceFunc, coders, '_').encode(values);
    return hexlify(encodedArray);
  };

  _proto11.decode = function decode(types, data) {
    var _this7 = this;

    var coders = [];
    types.forEach(function (type) {
      // See encode for details
      var typeObject = null; // tslint:disable-next-line: prefer-conditional-expression

      if (typeof type === 'string') {
        typeObject = parseParam(type);
      } else {
        typeObject = deepCopy(type);
      }

      coders.push(getParamCoder(_this7.coerceFunc, typeObject));
    }, this);
    var result = new CoderTuple(this.coerceFunc, coders, '_').decode(arrayify(data) || new Uint8Array(), 0).value;
    return result;
  };

  return AbiCoder;
}();

/**
 * @packageDocumentation
 * @module avalanche-contract
 * @hidden
 */
var jsonInterfaceMethodToString = function jsonInterfaceMethodToString(json) {
  if (isObject(json) && json.name && json.name.includes('(')) {
    return json.name;
  }

  return json.name + "(" + flattenTypes(false, json.inputs).join(',') + ")";
};
var flattenTypes = function flattenTypes(includeTuple, puts) {
  // console.log("entered _flattenTypes. inputs/outputs: " + puts)
  var types = [];
  puts.forEach(function (param) {
    if (typeof param.components === 'object') {
      if (param.type.substring(0, 5) !== 'tuple') {
        throw new Error('components found but type is not tuple; report on GitHub');
      }

      var suffix = '';
      var arrayBracket = param.type.indexOf('[');

      if (arrayBracket >= 0) {
        suffix = param.type.substring(arrayBracket);
      }

      var result = flattenTypes(includeTuple, param.components); // console.log("result should have things: " + result)

      if (isArray(result) && includeTuple) {
        // console.log("include tuple word, and its an array. joining...: " + result.types)
        types.push("tuple(" + result.join(',') + ")" + suffix);
      } else if (!includeTuple) {
        // console.log("don't include tuple, but its an array. joining...: " + result)
        types.push("(" + result.join(',') + ")" + suffix);
      } else {
        // console.log("its a single type within a tuple: " + result.types)
        types.push("(" + result + ")");
      }
    } else {
      // console.log("its a type and not directly in a tuple: " + param.type)
      types.push(param.type);
    }
  });
  return types;
};
function bnToString(result) {
  if (BN.isBN(result)) {
    return result.toString();
  } else {
    return result;
  }
}

/**
 * @packageDocumentation
 * @module avalanche-contract
 * @hidden
 */
var AbiCoderClass = /*#__PURE__*/function () {
  function AbiCoderClass(coder) {
    this.coder = coder;
  }

  var _proto = AbiCoderClass.prototype;

  _proto.encodeFunctionSignature = function encodeFunctionSignature(functionName) {
    if (isObject(functionName)) {
      functionName = jsonInterfaceMethodToString(functionName);
    }

    var result = keccak256(toUtf8Bytes(functionName));
    return result.slice(0, 10);
  };

  _proto.encodeEventSignature = function encodeEventSignature(functionName) {
    if (isObject(functionName)) {
      functionName = jsonInterfaceMethodToString(functionName);
    }

    var result = keccak256(toUtf8Bytes(functionName));
    return result;
  };

  _proto.encodeParameter = function encodeParameter(types, param) {
    return this.encodeParameters([types], [param]);
  };

  _proto.encodeParameters = function encodeParameters(types, params) {
    return this.coder.encode(types, params);
  };

  _proto.encodeFunctionCall = function encodeFunctionCall(jsonInterface, params) {
    return this.encodeFunctionSignature(jsonInterface) + this.encodeParameters(jsonInterface.inputs, params).replace('0x', '');
  };

  _proto.decodeParameter = function decodeParameter(type, bytes) {
    return this.decodeParameters([type], bytes)[0];
  };

  _proto.decodeParameters = function decodeParameters(outputs, bytes) {
    if (isArray(outputs) && outputs.length === 0) {
      throw new Error('Empty outputs array given!');
    }

    if (!bytes || bytes === '0x' || bytes === '0X') {
      throw new Error("Invalid bytes string given: " + bytes);
    }

    var result = this.coder.decode(outputs, bytes);
    var returnValues = {};
    var decodedValue;

    if (isArray(result)) {
      if (outputs.length > 1) {
        outputs.forEach(function (output, i) {
          decodedValue = result[i];

          if (decodedValue === '0x') {
            decodedValue = null;
          }

          returnValues[i] = bnToString(decodedValue);

          if (isObject(output) && output.name) {
            returnValues[output.name] = bnToString(decodedValue);
          }
        });
        return returnValues;
      }

      return bnToString(result);
    }

    if (isObject(outputs[0]) && outputs[0].name) {
      returnValues[outputs[0].name] = bnToString(result);
    }

    returnValues[0] = bnToString(result);
    return returnValues;
  };

  _proto.decodeLog = function decodeLog(inputs, data, topics) {
    var _this = this;

    if (data === void 0) {
      data = '';
    }

    var returnValues = {};
    var topicCount = 0;
    var value;
    var nonIndexedInputKeys = [];
    var nonIndexedInputItems = [];

    if (!isArray(topics)) {
      topics = [topics];
    }

    inputs.forEach(function (input, i) {
      if (input.indexed) {
        if (input.type === 'string') {
          return;
        }

        value = topics[topicCount];

        if (_this.isStaticType(input.type)) {
          value = _this.decodeParameter(input.type, topics[topicCount]);
        }

        returnValues[i] = bnToString(value);
        returnValues[input.name] = bnToString(value);
        topicCount++;
        return;
      }

      nonIndexedInputKeys.push(i);
      nonIndexedInputItems.push(input);
    });

    if (data) {
      var values = this.decodeParameters(nonIndexedInputItems, data);
      var decodedValue;
      nonIndexedInputKeys.forEach(function (itemKey, index) {
        decodedValue = values[index];
        returnValues[itemKey] = bnToString(decodedValue);
        returnValues[nonIndexedInputItems[index].name] = bnToString(decodedValue);
      });
    }

    return returnValues;
  };

  _proto.isStaticType = function isStaticType(type) {
    if (type === 'bytes') {
      return false;
    }

    if (type === 'string') {
      return false;
    }

    if (type.indexOf('[') && type.slice(type.indexOf('[')).length === 2) {
      return false;
    }

    return true;
  };

  return AbiCoderClass;
}();

/**
 * @packageDocumentation
 * @module avalanche-contract
 * @hidden
 */
function AbiCoder$1() {
  return new AbiCoderClass(new AbiCoder());
}

/**
 * @packageDocumentation
 * @module avalanche-contract
 * @hidden
 */
var AbiItem = /*#__PURE__*/function () {
  // constructor
  function AbiItem(abiItem) {
    this.abiItem = abiItem;
    this.signature = this.abiItem.signature;
    this.name = this.abiItem.name;
    this.payable = this.abiItem.payable;
    this.anonymous = this.abiItem.anonymous;
    this.type = this.abiItem.type;
    this.inputs = this.abiItem.inputs;
    this.outputs = this.abiItem.outputs;
    this.contractMethodParameters = [];
  }

  var _proto = AbiItem.prototype;

  _proto.getInputLength = function getInputLength() {
    if (isArray(this.abiItem.inputs)) {
      return this.abiItem.inputs.length;
    }

    return 0;
  };

  _proto.getInputs = function getInputs() {
    if (isArray(this.abiItem.inputs)) {
      return this.abiItem.inputs;
    }

    return [];
  };

  _proto.getOutputs = function getOutputs() {
    if (isArray(this.abiItem.outputs)) {
      return this.abiItem.outputs;
    }

    return [];
  };

  _proto.getIndexedInputs = function getIndexedInputs() {
    return this.getInputs().filter(function (input) {
      return input.indexed === true;
    });
  };

  _proto.isOfType = function isOfType(type) {
    return this.abiItem.type === type;
  };

  return AbiItem;
}();

/**
 * @packageDocumentation
 * @module avalanche-contract
 * @hidden
 */
var AbiModel = /*#__PURE__*/function () {
  function AbiModel(mappedAbi) {
    this.abi = mappedAbi;
  }

  var _proto = AbiModel.prototype;

  _proto.getMethod = function getMethod(name) {
    if (this.hasMethod(name)) {
      return this.abi.methods[name];
    }

    return false;
  };

  _proto.getMethods = function getMethods() {
    return this.abi.methods;
  };

  _proto.getEvent = function getEvent(name) {
    if (this.hasEvent(name)) {
      return this.abi.events[name];
    }

    return false;
  };

  _proto.getFallback = function getFallback() {
    if (this.hasFallback()) {
      return this.abi.fallback;
    }

    return false;
  };

  _proto.getReceive = function getReceive() {
    if (this.hasReceive()) {
      return this.abi.receive;
    }

    return false;
  };

  _proto.getEvents = function getEvents() {
    return this.abi.events;
  };

  _proto.getEventBySignature = function getEventBySignature(signature) {
    var _this = this;

    var event;
    Object.keys(this.abi.events).forEach(function (key) {
      if (_this.abi.events[key].signature === signature) {
        event = _this.abi.events[key];
      }
    });
    return event;
  };

  _proto.hasMethod = function hasMethod(name) {
    return typeof this.abi.methods[name] !== 'undefined';
  };

  _proto.hasFallback = function hasFallback() {
    return typeof this.abi.fallback !== 'undefined';
  };

  _proto.hasReceive = function hasReceive() {
    return typeof this.abi.receive !== 'undefined';
  };

  _proto.hasEvent = function hasEvent(name) {
    return typeof this.abi.events[name] !== 'undefined';
  };

  return AbiModel;
}();

/**
 * @packageDocumentation
 * @module avalanche-contract
 * @hidden
 */
var abiMapper = function abiMapper(abi, abiCoder) {
  var mappedAbiItems = {
    methods: {},
    events: {},
    fallback: undefined,
    receive: undefined
  };
  var hasConstructor = false;
  abi.forEach(function (abiItem) {
    abiItem.constant = isConstant(abiItem);
    abiItem.payable = isPayable(abiItem);

    if (abiItem.name) {
      abiItem.funcName = jsonInterfaceMethodToString(abiItem);
    }

    var abiItemModel;

    if (abiItem.type === 'function') {
      abiItem.signature = abiCoder.encodeFunctionSignature(abiItem.funcName);
      abiItemModel = new AbiItem(abiItem); // Check if an method already exists with this name and if it exists than create an array and push this abiItem
      // into it. This will be used if there are methods with the same name but with different arguments.

      if (!mappedAbiItems.methods[abiItem.name]) {
        mappedAbiItems.methods[abiItem.name] = abiItemModel;
      } else {
        if (isArray(mappedAbiItems.methods[abiItem.name])) {
          mappedAbiItems.methods[abiItem.name].push(abiItemModel);
        } else {
          mappedAbiItems.methods[abiItem.name] = [mappedAbiItems.methods[abiItem.name], abiItemModel];
        }
      }

      mappedAbiItems.methods[abiItem.signature] = abiItemModel;
      mappedAbiItems.methods[abiItem.funcName] = abiItemModel;
      return;
    }

    if (abiItem.type === 'event') {
      abiItem.signature = abiCoder.encodeEventSignature(abiItem.funcName);
      abiItemModel = new AbiItem(abiItem);

      if (!mappedAbiItems.events[abiItem.name] || mappedAbiItems.events[abiItem.name].name === 'bound ') {
        mappedAbiItems.events[abiItem.name] = abiItemModel;
      }

      mappedAbiItems.events[abiItem.signature] = abiItemModel;
      mappedAbiItems.events[abiItem.funcName] = abiItemModel;
    }

    if (abiItem.type === 'fallback' || abiItem.type === 'receive') {
      abiItem.signature = abiItem.type;
      mappedAbiItems[abiItem.type] = new AbiItem(abiItem);
    }

    if (abiItem.type === 'constructor') {
      abiItem.signature = abiItem.type; // tslint:disable-next-line: no-string-literal

      mappedAbiItems.methods['contractConstructor'] = new AbiItem(abiItem);
      hasConstructor = true;
    }
  });

  if (!hasConstructor) {
    // tslint:disable-next-line: no-string-literal
    mappedAbiItems.methods['contractConstructor'] = new AbiItem({
      inputs: [],
      payable: false,
      constant: false,
      type: 'constructor'
    });
  }

  return new AbiModel(mappedAbiItems);
};
var isConstant = function isConstant(abiItem) {
  return abiItem.stateMutability === 'view' || abiItem.stateMutability === 'pure' || abiItem.constant;
};
var isPayable = function isPayable(abiItem) {
  return abiItem.stateMutability === 'payable' || abiItem.payable;
};

/**
 * @packageDocumentation
 * @module avalanche-contract
 * @hidden
 */
var methodEncoder = function methodEncoder(abiCoder, abiItemModel, deployData) {
  if (abiItemModel.isOfType('receive')) {
    return undefined;
  }

  if (abiItemModel.isOfType('fallback')) {
    return abiItemModel.contractMethodParameters.length ? abiItemModel.contractMethodParameters[0] : undefined;
  }

  var encodedParameters = abiCoder.encodeParameters(abiItemModel.getInputs(), abiItemModel.contractMethodParameters);

  if (encodedParameters.startsWith('0x')) {
    encodedParameters = encodedParameters.slice(2);
  }

  if (abiItemModel.isOfType('constructor')) {
    if (!deployData) {
      throw new Error('The contract has no contract data option set. This is necessary to append the constructor parameters.');
    }

    return deployData + encodedParameters;
  }

  if (abiItemModel.isOfType('function')) {
    return abiItemModel.signature + encodedParameters;
  }

  return encodedParameters;
};
var eventFilterEncoder = function eventFilterEncoder(abiCoder, abiItemModel, filter) {
  var topics = [];
  abiItemModel.getIndexedInputs().forEach(function (input) {
    if (filter[input.name]) {
      var filterItem = filter[input.name];

      if (isArray(filterItem)) {
        filterItem = filterItem.map(function (item) {
          return abiCoder.encodeParameter(input.type, item);
        });
        topics.push(filterItem);
        return;
      }

      topics.push(abiCoder.encodeParameter(input.type, filterItem));
      return;
    }

    topics.push(null);
  });
  return topics;
};

/**
 * @packageDocumentation
 * @module avalanche-contract
 * @hidden
 */
var ContractStatus;

(function (ContractStatus) {
  ContractStatus["INITIALISED"] = "initialised";
  ContractStatus["TESTED"] = "tested";
  ContractStatus["ERROR"] = "error";
  ContractStatus["SIGNED"] = "signed";
  ContractStatus["SENT"] = "sent";
  ContractStatus["REJECTED"] = "rejected";
  ContractStatus["DEPLOYED"] = "deployed";
  ContractStatus["CALLED"] = "called";
})(ContractStatus || (ContractStatus = {}));

var ContractMethod = /*#__PURE__*/function () {
  function ContractMethod(methodKey, params, abiItem, contract) {
    this.methodKey = methodKey;
    this.contract = contract;
    this.wallet = contract.wallet;
    this.params = params;
    this.abiItem = abiItem;
    this.transaction = this.createTransaction();
    this.callPayload = undefined;
    this.callResponse = undefined;
  }

  var _proto = ContractMethod.prototype;

  _proto.send = function send(params) {
    var _this = this;

    if (params && !params.gasLimit) {
      params.gasLimit = params.gas;
    }

    try {
      var gasLimit = params.gasLimit; // change by estimateGas

      var signTxs = function signTxs() {
        _this.transaction = _this.transaction.map(function (tx) {
          return _extends({}, tx, params, {
            gasLimit: gasLimit
          });
        });
        var waitConfirm = params && params.waitConfirm === false ? false : true;
        var updateNonce = params && params.nonce !== undefined ? false : true;

        _this.signTransaction(updateNonce).then(function (signed) {
          _this.sendTransaction(signed).then(function (sent) {
            var txn = sent[0],
                id = sent[1];
            _this.transaction = txn;
            _this.contract.transaction = _this.transaction;

            if (_this.transaction.isRejected()) {
              _this.transaction.emitter.reject(id); // in this case, id is error message

            } else if (waitConfirm) {
              _this.confirm(id).then(function () {
                _this.transaction.emitter.resolve(_this.contract);
              });
            } else {
              _this.transaction.emitter.resolve(_this.contract);
            }
          });
        })["catch"](function (error) {
          _this.transaction.emitter.reject(error);
        });
      };

      if (gasLimit === undefined) {
        this.estimateGas(params).then(function (gas) {
          gasLimit = hexToBN(gas);
          signTxs();
        });
      } else {
        signTxs();
      }

      return this.transaction.emitter;
    } catch (error) {
      throw error;
    }
  };

  _proto.call = /*#__PURE__*/function () {
    var _call = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee(options, blockNumber) {
      var shardID, keys, txPayload, sendPayload, _i, _keys, key, result;

      return _regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              if (blockNumber === void 0) {
                blockNumber = 'latest';
              }

              if (options && !options.gasLimit) {
                options.gasLimit = options.gas;
              }

              _context.prev = 2;
              shardID = options !== undefined && options.shardID !== undefined ? options.shardID : this.contract.shardID;
              this.transaction = this.transaction.map(function (tx) {
                return _extends({}, tx, options, {
                  nonce: 0
                });
              });
              keys = Object.keys(this.transaction.txPayload);
              txPayload = this.transaction.txPayload;
              sendPayload = {};

              for (_i = 0, _keys = keys; _i < _keys.length; _i++) {
                key = _keys[_i];

                // tslint:disable-next-line: no-unused-expression
                if (txPayload[key] !== '0x') {
                  sendPayload[key] = txPayload[key];
                }
              }

              _context.next = 11;
              return this.wallet.messenger.send(RPCMethod.Call, [sendPayload, blockNumber], // tslint:disable-line
              this.wallet.messenger.chainPrefix, shardID);

            case 11:
              result = _context.sent;
              this.callPayload = sendPayload;
              this.callResponse = result;

              if (!result.isError()) {
                _context.next = 18;
                break;
              }

              throw result.message;

            case 18:
              if (!result.isResult()) {
                _context.next = 24;
                break;
              }

              if (!(result.result === null)) {
                _context.next = 23;
                break;
              }

              return _context.abrupt("return", this.afterCall(undefined));

            case 23:
              return _context.abrupt("return", this.afterCall(result.result));

            case 24:
              _context.next = 29;
              break;

            case 26:
              _context.prev = 26;
              _context.t0 = _context["catch"](2);
              throw _context.t0;

            case 29:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, this, [[2, 26]]);
    }));

    function call(_x, _x2) {
      return _call.apply(this, arguments);
    }

    return call;
  }();

  _proto.estimateGas = /*#__PURE__*/function () {
    var _estimateGas = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee2(options) {
      var estPayload, txPayload, keys, _i2, _keys2, key, result;

      return _regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.prev = 0;
              estPayload = {};
              txPayload = this.transaction.txPayload;
              keys = ['from', 'to', 'gasPrice', 'value', 'data'];

              for (_i2 = 0, _keys2 = keys; _i2 < _keys2.length; _i2++) {
                key = _keys2[_i2];

                if (options && options[key]) {
                  estPayload[key] = options[key];
                } else if (txPayload[key] !== '0x') {
                  estPayload[key] = txPayload[key];
                }
              }

              if (this.abiItem.isOfType('constructor')) {
                delete estPayload.to;
              }

              _context2.t0 = getResultForData;
              _context2.next = 9;
              return this.wallet.messenger.send(RPCMethod.EstimateGas, [estPayload]);

            case 9:
              _context2.t1 = _context2.sent;
              result = (0, _context2.t0)(_context2.t1);

              if (!(result.responseType === 'error')) {
                _context2.next = 15;
                break;
              }

              throw result.message;

            case 15:
              if (!(result.responseType === 'raw')) {
                _context2.next = 19;
                break;
              }

              throw new Error('Get estimateGas fail');

            case 19:
              return _context2.abrupt("return", result);

            case 20:
              _context2.next = 25;
              break;

            case 22:
              _context2.prev = 22;
              _context2.t2 = _context2["catch"](0);
              throw _context2.t2;

            case 25:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, this, [[0, 22]]);
    }));

    function estimateGas(_x3) {
      return _estimateGas.apply(this, arguments);
    }

    return estimateGas;
  }();

  _proto.encodeABI = function encodeABI() {
    return methodEncoder(this.contract.abiCoder, this.abiItem, this.contract.data);
  };

  _proto.debug = function debug() {
    return {
      callResponse: this.callResponse,
      callPayload: this.callPayload
    };
  };

  _proto.signTransaction = /*#__PURE__*/function () {
    var _signTransaction = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee3(updateNonce) {
      var signed;
      return _regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.prev = 0;

              if (!this.wallet.signer) {
                _context3.next = 7;
                break;
              }

              _context3.next = 4;
              return this.wallet.signTransaction(this.transaction, this.wallet.signer, undefined, updateNonce, 'rlp', 'latest');

            case 4:
              _context3.t0 = _context3.sent;
              _context3.next = 10;
              break;

            case 7:
              _context3.next = 9;
              return this.wallet.signTransaction(this.transaction, updateNonce, 'rlp', 'latest');

            case 9:
              _context3.t0 = _context3.sent;

            case 10:
              signed = _context3.t0;

              if (this.abiItem.isOfType('constructor')) {
                this.contract.address = TransactionFactory.getContractAddress(signed);
              }

              this.contract.setStatus(ContractStatus.SIGNED);
              return _context3.abrupt("return", signed);

            case 16:
              _context3.prev = 16;
              _context3.t1 = _context3["catch"](0);
              throw _context3.t1;

            case 19:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, this, [[0, 16]]);
    }));

    function signTransaction(_x4) {
      return _signTransaction.apply(this, arguments);
    }

    return signTransaction;
  }();

  _proto.sendTransaction = /*#__PURE__*/function () {
    var _sendTransaction = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee4(signed) {
      var result;
      return _regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              _context4.prev = 0;
              _context4.next = 3;
              return signed.sendTransaction();

            case 3:
              result = _context4.sent;
              this.contract.setStatus(ContractStatus.SENT);
              return _context4.abrupt("return", result);

            case 8:
              _context4.prev = 8;
              _context4.t0 = _context4["catch"](0);
              throw _context4.t0;

            case 11:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, this, [[0, 8]]);
    }));

    function sendTransaction(_x5) {
      return _sendTransaction.apply(this, arguments);
    }

    return sendTransaction;
  }();

  _proto.confirm = /*#__PURE__*/function () {
    var _confirm = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/_regeneratorRuntime.mark(function _callee5(id) {
      var result;
      return _regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              _context5.prev = 0;
              _context5.next = 3;
              return this.transaction.confirm(id, 20, 1000, this.transaction ? this.transaction.txParams.shardID : this.contract.shardID);

            case 3:
              result = _context5.sent;

              if (result.receipt && result.txStatus === TxStatus.CONFIRMED) {
                if (this.abiItem.isOfType('constructor')) {
                  this.contract.setStatus(ContractStatus.DEPLOYED);
                } else {
                  this.contract.setStatus(ContractStatus.CALLED);
                }
              } else {
                this.contract.setStatus(ContractStatus.REJECTED);
              }

              _context5.next = 10;
              break;

            case 7:
              _context5.prev = 7;
              _context5.t0 = _context5["catch"](0);
              throw _context5.t0;

            case 10:
            case "end":
              return _context5.stop();
          }
        }
      }, _callee5, this, [[0, 7]]);
    }));

    function confirm(_x6) {
      return _confirm.apply(this, arguments);
    }

    return confirm;
  }();

  _proto.createTransaction = function createTransaction() {
    if (this.wallet.messenger) {
      if (this.abiItem.isOfType('constructor')) {
        // tslint:disable-next-line: no-string-literal
        this.contract.data = this.params[0]['data'] || '0x';
        this.abiItem.contractMethodParameters = // tslint:disable-next-line: no-string-literal
        this.params[0]['arguments'] || [];
      } else {
        this.abiItem.contractMethodParameters = this.params || [];
      }

      var defaultOptions = {
        gasLimit: new Unit(21000000).asWei().toWei(),
        gasPrice: new Unit(1).asGwei().toWei()
      };

      var txObject = _extends({}, defaultOptions, this.contract.options, this.params[0], {
        to: this.abiItem.isOfType('constructor') ? '0x' : getAddress(this.contract.address).checksum,
        data: this.encodeABI()
      }); // tslint:disable-line


      var result = new TransactionFactory(this.wallet.messenger).newTx(txObject);
      return result;
    } else {
      throw new Error('Messenger is not found');
    }
  };

  _proto.afterCall = function afterCall(response) {
    // length of `0x${methodSig}` is 2+4*2=10
    if (response.length % 32 === 10 && response.startsWith(this.contract.errorFuncSig)) {
      var errmsg = this.contract.abiCoder.decodeParameters([{
        type: 'string'
      }], '0x' + response.slice(10));
      throw {
        revert: errmsg[0]
      };
    }

    if (this.abiItem.isOfType('constructor') || this.abiItem.isOfType('fallback') || this.abiItem.isOfType('receive')) {
      return response;
    }

    var outputs = this.abiItem.getOutputs();

    if (outputs.length === 0) {
      // if outputs is empty, we can't know the call is revert or not
      return response;
    }

    if (!response || response === '0x') {
      // if outputs isn't empty, treat it as revert
      throw {
        revert: response
      };
    }

    if (outputs.length > 1) {
      return this.contract.abiCoder.decodeParameters(outputs, response);
    }

    return this.contract.abiCoder.decodeParameter(outputs[0], response); // return outputs;
  };

  return ContractMethod;
}();

/**
 * @packageDocumentation
 * @module avalanche-contract
 * @hidden
 */
var MethodFactory = /*#__PURE__*/function () {
  // constructor
  function MethodFactory(contract) {
    this.contract = contract;
    this.abiModel = this.contract.abiModel;
    this.abiCoder = this.contract.abiCoder;
    this.methodKeys = this.mapMethodKeys();
  }

  var _proto = MethodFactory.prototype;

  _proto.addMethodsToContract = function addMethodsToContract() {
    var _this = this;

    this.methodKeys.forEach(function (key) {
      var newObject = {};

      newObject[key] = function () {
        for (var _len = arguments.length, params = new Array(_len), _key = 0; _key < _len; _key++) {
          params[_key] = arguments[_key];
        }

        return new ContractMethod(key, params, _this.abiModel.getMethod(key), _this.contract);
      };

      Object.assign(_this.contract.methods, newObject);
    });

    if (this.abiModel.hasFallback()) {
      this.contract.fallback = function (calldata) {
        return new ContractMethod('fallback', [calldata], _this.abiModel.getFallback(), _this.contract);
      };
    }

    if (this.abiModel.hasReceive()) {
      this.contract.receive = function () {
        return new ContractMethod('receive', [], _this.abiModel.getReceive(), _this.contract);
      };
    }

    return this.contract;
  }
  /**
   * @function mapMethodKeys
   * @return {string[]} {description}
   */
  ;

  _proto.mapMethodKeys = function mapMethodKeys() {
    return Object.keys(this.abiModel.abi.methods);
  };

  return MethodFactory;
}();

/**
 * @packageDocumentation
 * @module avalanche-contract
 * @hidden
 */
var decode = function decode(abiCoder, abiItemModel, response) {
  var argumentTopics = response.topics;

  if (!abiItemModel.anonymous) {
    argumentTopics = response.topics.slice(1);
  }

  if (response.data === '0x') {
    response.data = null;
  }

  response.returnValues = abiCoder.decodeLog(abiItemModel.getInputs(), response.data, argumentTopics);
  response.event = abiItemModel.name;
  response.signature = abiItemModel.signature;
  response.raw = {
    data: response.data,
    topics: response.topics
  };

  if (abiItemModel.anonymous || !response.topics[0]) {
    response.signature = null;
  }

  delete response.data;
  delete response.topics;
  return response;
};

/**
 * @packageDocumentation
 * @module avalanche-contract
 * @hidden
 */
var inputLogFormatter = function inputLogFormatter(options) {
  if (options.fromBlock) {
    options.fromBlock = inputBlockNumberFormatter(options.fromBlock);
  }

  if (options.toBlock) {
    options.toBlock = inputBlockNumberFormatter(options.toBlock);
  } // make sure topics, get converted to hex


  options.topics = options.topics || [];
  options.topics = options.topics.map(function (topic) {
    return isArray(topic) ? topic.map(toTopic) : toTopic(topic);
  });

  if (options.address) {
    if (isArray(options.address)) {
      options.address = options.address.map(function (addr) {
        return inputAddressFormatter(addr);
      });
    } else {
      options.address = inputAddressFormatter(options.address);
    }
  }

  return options;
};
/**
 * Formats the output of a log
 *
 * @method outputLogFormatter
 *
 * @param {Object} log object
 *
 * @returns {Object} log
 */

var outputLogFormatter = function outputLogFormatter(log) {
  // generate a custom log id
  if (typeof log.blockHash === 'string' && typeof log.transactionHash === 'string' && typeof log.logIndex === 'string') {
    var shaId = keccak256('0x' + log.blockHash.replace('0x', '') + log.transactionHash.replace('0x', '') + log.logIndex.replace('0x', ''));
    shaId.replace('0x', '').substr(0, 8);
    log.id = "log_" + shaId;
  } else if (!log.id) {
    log.id = null;
  }

  if (log.blockNumber !== null) {
    log.blockNumber = hexToBN(log.blockNumber).toNumber();
  }

  if (log.transactionIndex !== null) {
    log.transactionIndex = hexToBN(log.transactionIndex).toNumber();
  }

  if (log.logIndex !== null) {
    log.logIndex = hexToBN(log.logIndex).toNumber();
  }

  if (log.address) {
    log.address = toChecksumAddress(log.address);
  }

  return log;
};
var inputBlockNumberFormatter = function inputBlockNumberFormatter(blockNumber) {
  if (blockNumber === undefined || blockNumber === null || isPredefinedBlockNumber(blockNumber)) {
    return blockNumber;
  }

  if (isHexString(blockNumber)) {
    if (isString(blockNumber)) {
      return blockNumber.toLowerCase();
    }

    return blockNumber;
  }

  return numberToHex(blockNumber);
};
var isPredefinedBlockNumber = function isPredefinedBlockNumber(blockNumber) {
  return blockNumber === 'latest' || blockNumber === 'pending' || blockNumber === 'earliest';
};
var inputAddressFormatter = function inputAddressFormatter(address) {
  if (isAddress(address)) {
    return "0x" + address.toLowerCase().replace('0x', '');
  }

  throw new Error("Provided address \"" + address + "\" is invalid, the capitalization checksum test failed, or its an indrect IBAN address which can't be converted.");
};
var toTopic = function toTopic(value) {
  if (value === null || typeof value === 'undefined') {
    return null;
  }

  value = String(value);

  if (value.indexOf('0x') === 0) {
    return value;
  }

  return hexlify(toUtf8Bytes(value));
};

var EventMethod = /*#__PURE__*/function (_LogSub) {
  _inheritsLoose(EventMethod, _LogSub);

  function EventMethod(methodKey, params, abiItem, contract) {
    var _this;

    _this = _LogSub.call(this, inputLogFormatter(params), contract.wallet.messenger, contract.shardID) || this;
    _this.methodKey = methodKey;
    _this.contract = contract;
    _this.params = params;
    _this.abiItem = abiItem; // this.subscribe();

    return _this;
  } // call() {}
  // estimateGas() {}
  // encodeABI() {}


  var _proto = EventMethod.prototype;

  _proto.onNewSubscriptionItem = function onNewSubscriptionItem(subscriptionItem) {
    var formatted = outputLogFormatter(subscriptionItem.method !== undefined ? subscriptionItem.params.result : subscriptionItem);
    var log = decode(this.contract.abiCoder, this.abiItem, formatted);

    if (log.removed && this.emitter) {
      this.emitter.emit('changed', log);
    }

    return log;
  };

  return EventMethod;
}(LogSub);

/**
 * @packageDocumentation
 * @module avalanche-contract
 * @hidden
 */
var EventFactory = /*#__PURE__*/function () {
  // constructor
  function EventFactory(contract) {
    this.contract = contract;
    this.abiModel = this.contract.abiModel;
    this.abiCoder = this.contract.abiCoder;
    this.eventKeys = this.mapEventKeys();
  }

  var _proto = EventFactory.prototype;

  _proto.addEventsToContract = function addEventsToContract() {
    var _this = this;

    this.eventKeys.forEach(function (key) {
      var newObject = {};

      newObject[key] = function (params) {
        return new EventMethod(key, // params,
        _this.map(_this.abiModel.getEvent(key), _this.contract, params), _this.abiModel.getEvent(key), _this.contract);
      };

      Object.assign(_this.contract.events, newObject);
    });
    return this.contract;
  }
  /**
   * @function mapMethodKeys
   * @return {string[]} {description}
   */
  ;

  _proto.mapEventKeys = function mapEventKeys() {
    return Object.keys(this.abiModel.abi.events);
  };

  _proto.map = function map(abiItemModel, contract, options) {
    if (!options) {
      options = {};
    }

    if (!isArray(options.topics)) {
      options.topics = [];
    }

    if (typeof options.fromBlock !== 'undefined') {
      options.fromBlock = inputBlockNumberFormatter(options.fromBlock);
    } // else if (contract.defaultBlock !== null) {
    //   options.fromBlock = contract.defaultBlock;
    // }


    if (typeof options.toBlock !== 'undefined') {
      options.toBlock = inputBlockNumberFormatter(options.toBlock);
    }

    if (typeof options.filter !== 'undefined') {
      options.topics = options.topics.concat(eventFilterEncoder(this.abiCoder, abiItemModel, options.filter));
      delete options.filter;
    }

    if (!abiItemModel.anonymous) {
      options.topics.unshift(abiItemModel.signature);
    }

    if (!options.address) {
      options.address = contract.address;
    }

    return options;
  };

  return EventFactory;
}();

var Contract = /*#__PURE__*/function () {
  function Contract(abi, address, options, wallet, status) {
    if (abi === void 0) {
      abi = [];
    }

    if (address === void 0) {
      address = '0x';
    }

    if (options === void 0) {
      options = {};
    }

    if (status === void 0) {
      status = ContractStatus.INITIALISED;
    }

    this.fallback = undefined;
    this.receive = undefined;
    this.abi = [];
    this.errorFunc = 'Error(string)'; // super();

    this.abi = abi;
    this.abiCoder = AbiCoder$1();
    this.abiModel = abiMapper(abi, this.abiCoder);
    this.options = options;
    this.address = this.options.address || address;
    this.shardID = this.options.shardID || wallet.messenger.currentShard;
    this.wallet = wallet;
    this.methods = {};
    this.events = {};
    this.runMethodFactory();
    this.runEventFactory();
    this.status = status;
    this.errorFuncSig = this.abiCoder.encodeFunctionSignature(this.errorFunc); // tslint:disable-next-line: no-unused-expression
  }

  var _proto = Contract.prototype;

  _proto.isInitialised = function isInitialised() {
    return this.status === ContractStatus.INITIALISED;
  };

  _proto.isSigned = function isSigned() {
    return this.status === ContractStatus.SIGNED;
  };

  _proto.isSent = function isSent() {
    return this.status === ContractStatus.SENT;
  };

  _proto.isDeployed = function isDeployed() {
    return this.status === ContractStatus.DEPLOYED;
  };

  _proto.isRejected = function isRejected() {
    return this.status === ContractStatus.REJECTED;
  };

  _proto.isCalled = function isCalled() {
    return this.status === ContractStatus.CALLED;
  };

  _proto.setStatus = function setStatus(status) {
    this.status = status;
  };

  // deploy
  _proto.deploy = function deploy(options) {
    return this.methods.contractConstructor(options);
  };

  _proto.runMethodFactory = function runMethodFactory() {
    return new MethodFactory(this).addMethodsToContract();
  };

  _proto.runEventFactory = function runEventFactory() {
    return new EventFactory(this).addEventsToContract();
  };

  _proto.connect = function connect(wallet) {
    this.wallet = wallet;
  };

  _proto.setMessegner = function setMessegner(messenger) {
    if (this.wallet instanceof Wallet) {
      this.wallet.setMessenger(messenger);
    } else {
      this.wallet.messenger = messenger;
    }
  };

  _createClass(Contract, [{
    key: "jsonInterface",
    get: function get() {
      return this.abiModel;
    },
    set: function set(value) {
      this.abiModel = abiMapper(value, this.abiCoder);
      this.runMethodFactory();
      this.runEventFactory();
    }
  }, {
    key: "address",
    get: function get() {
      return this.options.address || this.address;
    },
    set: function set(value) {
      this.options.address = value;
    }
  }, {
    key: "data",
    get: function get() {
      return this.options.data;
    },
    set: function set(value) {
      this.options.data = value;
    }
  }]);

  return Contract;
}();

/**
 * @packageDocumentation
 * @module avalanche-contract
 */
var ContractFactory = /*#__PURE__*/function () {
  function ContractFactory(wallet) {
    this.wallet = wallet;
  }

  var _proto = ContractFactory.prototype;

  _proto.createContract = function createContract(abi, address, options) {
    return new Contract(abi, address, options, this.wallet);
  };

  return ContractFactory;
}();

export { AbiCoder$1 as AbiCoder, Contract, ContractFactory, formatBytes32String, parseBytes32String, toUtf8Bytes, toUtf8String };
//# sourceMappingURL=avalanche-js-contract.esm.js.map
