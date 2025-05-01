/*! @name videojs-contrib-quality-levels @version 2.2.1 @license Apache-2.0 */
(function (videojs,QUnit,sinon) {
	'use strict';

	videojs = videojs && videojs.hasOwnProperty('default') ? videojs['default'] : videojs;
	QUnit = QUnit && QUnit.hasOwnProperty('default') ? QUnit['default'] : QUnit;
	sinon = sinon && sinon.hasOwnProperty('default') ? sinon['default'] : sinon;

	var commonjsGlobal = typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

	var empty = {};

	var empty$1 = /*#__PURE__*/Object.freeze({
		default: empty
	});

	var minDoc = ( empty$1 && empty ) || empty$1;

	var topLevel = typeof commonjsGlobal !== 'undefined' ? commonjsGlobal :
	    typeof window !== 'undefined' ? window : {};


	var doccy;

	if (typeof document !== 'undefined') {
	    doccy = document;
	} else {
	    doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'];

	    if (!doccy) {
	        doccy = topLevel['__GLOBAL_DOCUMENT_CACHE@4'] = minDoc;
	    }
	}

	var document_1 = doccy;

	function _inheritsLoose(subClass, superClass) {
	  subClass.prototype = Object.create(superClass.prototype);
	  subClass.prototype.constructor = subClass;
	  subClass.__proto__ = superClass;
	}

	function _assertThisInitialized(self) {
	  if (self === void 0) {
	    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
	  }

	  return self;
	}

	var cov_2mr4nt616g = function () {
	  var path = '/Users/poneill/dev/videojs-contrib-quality-levels/src/quality-level.js',
	      hash = 'efdd7d73cc04bf625e32b7093b05254de919ac17',
	      Function = function () {}.constructor,
	      global = new Function('return this')(),
	      gcv = '__coverage__',
	      coverageData = {
	    path: '/Users/poneill/dev/videojs-contrib-quality-levels/src/quality-level.js',
	    statementMap: {
	      '0': {
	        start: {
	          line: 30,
	          column: 16
	        },
	        end: {
	          line: 30,
	          column: 20
	        }
	      },
	      '1': {
	        start: {
	          line: 32,
	          column: 4
	        },
	        end: {
	          line: 32,
	          column: 33
	        }
	      },
	      '2': {
	        start: {
	          line: 33,
	          column: 4
	        },
	        end: {
	          line: 33,
	          column: 27
	        }
	      },
	      '3': {
	        start: {
	          line: 34,
	          column: 4
	        },
	        end: {
	          line: 34,
	          column: 39
	        }
	      },
	      '4': {
	        start: {
	          line: 35,
	          column: 4
	        },
	        end: {
	          line: 35,
	          column: 41
	        }
	      },
	      '5': {
	        start: {
	          line: 36,
	          column: 4
	        },
	        end: {
	          line: 36,
	          column: 45
	        }
	      },
	      '6': {
	        start: {
	          line: 37,
	          column: 4
	        },
	        end: {
	          line: 37,
	          column: 47
	        }
	      },
	      '7': {
	        start: {
	          line: 38,
	          column: 4
	        },
	        end: {
	          line: 38,
	          column: 44
	        }
	      },
	      '8': {
	        start: {
	          line: 40,
	          column: 4
	        },
	        end: {
	          line: 58,
	          column: 7
	        }
	      },
	      '9': {
	        start: {
	          line: 47,
	          column: 8
	        },
	        end: {
	          line: 47,
	          column: 32
	        }
	      },
	      '10': {
	        start: {
	          line: 56,
	          column: 8
	        },
	        end: {
	          line: 56,
	          column: 31
	        }
	      },
	      '11': {
	        start: {
	          line: 60,
	          column: 4
	        },
	        end: {
	          line: 60,
	          column: 17
	        }
	      }
	    },
	    fnMap: {
	      '0': {
	        name: '(anonymous_0)',
	        decl: {
	          start: {
	            line: 28,
	            column: 2
	          },
	          end: {
	            line: 28,
	            column: 3
	          }
	        },
	        loc: {
	          start: {
	            line: 28,
	            column: 30
	          },
	          end: {
	            line: 61,
	            column: 3
	          }
	        },
	        line: 28
	      }
	    },
	    branchMap: {},
	    s: {
	      '0': 0,
	      '1': 0,
	      '2': 0,
	      '3': 0,
	      '4': 0,
	      '5': 0,
	      '6': 0,
	      '7': 0,
	      '8': 0,
	      '9': 0,
	      '10': 0,
	      '11': 0
	    },
	    f: {
	      '0': 0
	    },
	    b: {},
	    _coverageSchema: '332fd63041d2c1bcb487cc26dd0d5f7d97098a6c'
	  },
	      coverage = global[gcv] || (global[gcv] = {});

	  if (coverage[path] && coverage[path].hash === hash) {
	    return coverage[path];
	  }

	  coverageData.hash = hash;
	  return coverage[path] = coverageData;
	}();

	var QualityLevel = function QualityLevel(representation) {
	  cov_2mr4nt616g.f[0]++;
	  var level = (cov_2mr4nt616g.s[0]++, this);
	  cov_2mr4nt616g.s[1]++;
	  level.id = representation.id;
	  cov_2mr4nt616g.s[2]++;
	  level.label = level.id;
	  cov_2mr4nt616g.s[3]++;
	  level.width = representation.width;
	  cov_2mr4nt616g.s[4]++;
	  level.height = representation.height;
	  cov_2mr4nt616g.s[5]++;
	  level.bitrate = representation.bandwidth;
	  cov_2mr4nt616g.s[6]++;
	  level.frameRate = representation.frameRate;
	  cov_2mr4nt616g.s[7]++;
	  level.enabled_ = representation.enabled;
	  cov_2mr4nt616g.s[8]++;
	  Object.defineProperty(level, 'enabled', {
	    get: function get() {
	      cov_2mr4nt616g.s[9]++;
	      return level.enabled_();
	    },
	    set: function set(enable) {
	      cov_2mr4nt616g.s[10]++;
	      level.enabled_(enable);
	    }
	  });
	  cov_2mr4nt616g.s[11]++;
	  return level;
	};

	var cov_1i6kp4vwyb = function () {
	  var path = '/Users/poneill/dev/videojs-contrib-quality-levels/src/quality-level-list.js',
	      hash = '8f1a06f0000cc851da7fe4f49b3967fd76899084',
	      Function = function () {}.constructor,
	      global = new Function('return this')(),
	      gcv = '__coverage__',
	      coverageData = {
	    path: '/Users/poneill/dev/videojs-contrib-quality-levels/src/quality-level-list.js',
	    statementMap: {
	      '0': {
	        start: {
	          line: 26,
	          column: 4
	        },
	        end: {
	          line: 26,
	          column: 12
	        }
	      },
	      '1': {
	        start: {
	          line: 28,
	          column: 15
	        },
	        end: {
	          line: 28,
	          column: 19
	        }
	      },
	      '2': {
	        start: {
	          line: 30,
	          column: 4
	        },
	        end: {
	          line: 30,
	          column: 22
	        }
	      },
	      '3': {
	        start: {
	          line: 31,
	          column: 4
	        },
	        end: {
	          line: 31,
	          column: 29
	        }
	      },
	      '4': {
	        start: {
	          line: 39,
	          column: 4
	        },
	        end: {
	          line: 43,
	          column: 7
	        }
	      },
	      '5': {
	        start: {
	          line: 41,
	          column: 8
	        },
	        end: {
	          line: 41,
	          column: 35
	        }
	      },
	      '6': {
	        start: {
	          line: 51,
	          column: 4
	        },
	        end: {
	          line: 55,
	          column: 7
	        }
	      },
	      '7': {
	        start: {
	          line: 53,
	          column: 8
	        },
	        end: {
	          line: 53,
	          column: 35
	        }
	      },
	      '8': {
	        start: {
	          line: 57,
	          column: 4
	        },
	        end: {
	          line: 57,
	          column: 16
	        }
	      },
	      '9': {
	        start: {
	          line: 74,
	          column: 23
	        },
	        end: {
	          line: 74,
	          column: 66
	        }
	      },
	      '10': {
	        start: {
	          line: 77,
	          column: 4
	        },
	        end: {
	          line: 79,
	          column: 5
	        }
	      },
	      '11': {
	        start: {
	          line: 78,
	          column: 6
	        },
	        end: {
	          line: 78,
	          column: 26
	        }
	      },
	      '12': {
	        start: {
	          line: 81,
	          column: 18
	        },
	        end: {
	          line: 81,
	          column: 37
	        }
	      },
	      '13': {
	        start: {
	          line: 83,
	          column: 4
	        },
	        end: {
	          line: 83,
	          column: 52
	        }
	      },
	      '14': {
	        start: {
	          line: 85,
	          column: 4
	        },
	        end: {
	          line: 91,
	          column: 5
	        }
	      },
	      '15': {
	        start: {
	          line: 86,
	          column: 6
	        },
	        end: {
	          line: 90,
	          column: 9
	        }
	      },
	      '16': {
	        start: {
	          line: 88,
	          column: 10
	        },
	        end: {
	          line: 88,
	          column: 37
	        }
	      },
	      '17': {
	        start: {
	          line: 93,
	          column: 4
	        },
	        end: {
	          line: 93,
	          column: 36
	        }
	      },
	      '18': {
	        start: {
	          line: 95,
	          column: 4
	        },
	        end: {
	          line: 98,
	          column: 7
	        }
	      },
	      '19': {
	        start: {
	          line: 100,
	          column: 4
	        },
	        end: {
	          line: 100,
	          column: 24
	        }
	      },
	      '20': {
	        start: {
	          line: 111,
	          column: 18
	        },
	        end: {
	          line: 111,
	          column: 22
	        }
	      },
	      '21': {
	        start: {
	          line: 113,
	          column: 4
	        },
	        end: {
	          line: 124,
	          column: 5
	        }
	      },
	      '22': {
	        start: {
	          line: 114,
	          column: 6
	        },
	        end: {
	          line: 123,
	          column: 7
	        }
	      },
	      '23': {
	        start: {
	          line: 115,
	          column: 8
	        },
	        end: {
	          line: 115,
	          column: 47
	        }
	      },
	      '24': {
	        start: {
	          line: 117,
	          column: 8
	        },
	        end: {
	          line: 121,
	          column: 9
	        }
	      },
	      '25': {
	        start: {
	          line: 118,
	          column: 10
	        },
	        end: {
	          line: 118,
	          column: 35
	        }
	      },
	      '26': {
	        start: {
	          line: 119,
	          column: 15
	        },
	        end: {
	          line: 121,
	          column: 9
	        }
	      },
	      '27': {
	        start: {
	          line: 120,
	          column: 10
	        },
	        end: {
	          line: 120,
	          column: 32
	        }
	      },
	      '28': {
	        start: {
	          line: 122,
	          column: 8
	        },
	        end: {
	          line: 122,
	          column: 14
	        }
	      },
	      '29': {
	        start: {
	          line: 126,
	          column: 4
	        },
	        end: {
	          line: 131,
	          column: 5
	        }
	      },
	      '30': {
	        start: {
	          line: 127,
	          column: 6
	        },
	        end: {
	          line: 130,
	          column: 9
	        }
	      },
	      '31': {
	        start: {
	          line: 133,
	          column: 4
	        },
	        end: {
	          line: 133,
	          column: 19
	        }
	      },
	      '32': {
	        start: {
	          line: 144,
	          column: 4
	        },
	        end: {
	          line: 150,
	          column: 5
	        }
	      },
	      '33': {
	        start: {
	          line: 145,
	          column: 20
	        },
	        end: {
	          line: 145,
	          column: 27
	        }
	      },
	      '34': {
	        start: {
	          line: 147,
	          column: 6
	        },
	        end: {
	          line: 149,
	          column: 7
	        }
	      },
	      '35': {
	        start: {
	          line: 148,
	          column: 8
	        },
	        end: {
	          line: 148,
	          column: 21
	        }
	      },
	      '36': {
	        start: {
	          line: 151,
	          column: 4
	        },
	        end: {
	          line: 151,
	          column: 16
	        }
	      },
	      '37': {
	        start: {
	          line: 160,
	          column: 4
	        },
	        end: {
	          line: 160,
	          column: 29
	        }
	      },
	      '38': {
	        start: {
	          line: 161,
	          column: 4
	        },
	        end: {
	          line: 161,
	          column: 28
	        }
	      },
	      '39': {
	        start: {
	          line: 170,
	          column: 0
	        },
	        end: {
	          line: 174,
	          column: 2
	        }
	      },
	      '40': {
	        start: {
	          line: 177,
	          column: 0
	        },
	        end: {
	          line: 179,
	          column: 1
	        }
	      },
	      '41': {
	        start: {
	          line: 178,
	          column: 2
	        },
	        end: {
	          line: 178,
	          column: 50
	        }
	      }
	    },
	    fnMap: {
	      '0': {
	        name: '(anonymous_0)',
	        decl: {
	          start: {
	            line: 25,
	            column: 2
	          },
	          end: {
	            line: 25,
	            column: 3
	          }
	        },
	        loc: {
	          start: {
	            line: 25,
	            column: 16
	          },
	          end: {
	            line: 58,
	            column: 3
	          }
	        },
	        line: 25
	      },
	      '1': {
	        name: '(anonymous_1)',
	        decl: {
	          start: {
	            line: 73,
	            column: 2
	          },
	          end: {
	            line: 73,
	            column: 3
	          }
	        },
	        loc: {
	          start: {
	            line: 73,
	            column: 34
	          },
	          end: {
	            line: 101,
	            column: 3
	          }
	        },
	        line: 73
	      },
	      '2': {
	        name: '(anonymous_2)',
	        decl: {
	          start: {
	            line: 110,
	            column: 2
	          },
	          end: {
	            line: 110,
	            column: 3
	          }
	        },
	        loc: {
	          start: {
	            line: 110,
	            column: 35
	          },
	          end: {
	            line: 134,
	            column: 3
	          }
	        },
	        line: 110
	      },
	      '3': {
	        name: '(anonymous_3)',
	        decl: {
	          start: {
	            line: 143,
	            column: 2
	          },
	          end: {
	            line: 143,
	            column: 3
	          }
	        },
	        loc: {
	          start: {
	            line: 143,
	            column: 26
	          },
	          end: {
	            line: 152,
	            column: 3
	          }
	        },
	        line: 143
	      },
	      '4': {
	        name: '(anonymous_4)',
	        decl: {
	          start: {
	            line: 159,
	            column: 2
	          },
	          end: {
	            line: 159,
	            column: 3
	          }
	        },
	        loc: {
	          start: {
	            line: 159,
	            column: 12
	          },
	          end: {
	            line: 162,
	            column: 3
	          }
	        },
	        line: 159
	      }
	    },
	    branchMap: {
	      '0': {
	        loc: {
	          start: {
	            line: 77,
	            column: 4
	          },
	          end: {
	            line: 79,
	            column: 5
	          }
	        },
	        type: 'if',
	        locations: [{
	          start: {
	            line: 77,
	            column: 4
	          },
	          end: {
	            line: 79,
	            column: 5
	          }
	        }, {
	          start: {
	            line: 77,
	            column: 4
	          },
	          end: {
	            line: 79,
	            column: 5
	          }
	        }],
	        line: 77
	      },
	      '1': {
	        loc: {
	          start: {
	            line: 85,
	            column: 4
	          },
	          end: {
	            line: 91,
	            column: 5
	          }
	        },
	        type: 'if',
	        locations: [{
	          start: {
	            line: 85,
	            column: 4
	          },
	          end: {
	            line: 91,
	            column: 5
	          }
	        }, {
	          start: {
	            line: 85,
	            column: 4
	          },
	          end: {
	            line: 91,
	            column: 5
	          }
	        }],
	        line: 85
	      },
	      '2': {
	        loc: {
	          start: {
	            line: 114,
	            column: 6
	          },
	          end: {
	            line: 123,
	            column: 7
	          }
	        },
	        type: 'if',
	        locations: [{
	          start: {
	            line: 114,
	            column: 6
	          },
	          end: {
	            line: 123,
	            column: 7
	          }
	        }, {
	          start: {
	            line: 114,
	            column: 6
	          },
	          end: {
	            line: 123,
	            column: 7
	          }
	        }],
	        line: 114
	      },
	      '3': {
	        loc: {
	          start: {
	            line: 117,
	            column: 8
	          },
	          end: {
	            line: 121,
	            column: 9
	          }
	        },
	        type: 'if',
	        locations: [{
	          start: {
	            line: 117,
	            column: 8
	          },
	          end: {
	            line: 121,
	            column: 9
	          }
	        }, {
	          start: {
	            line: 117,
	            column: 8
	          },
	          end: {
	            line: 121,
	            column: 9
	          }
	        }],
	        line: 117
	      },
	      '4': {
	        loc: {
	          start: {
	            line: 119,
	            column: 15
	          },
	          end: {
	            line: 121,
	            column: 9
	          }
	        },
	        type: 'if',
	        locations: [{
	          start: {
	            line: 119,
	            column: 15
	          },
	          end: {
	            line: 121,
	            column: 9
	          }
	        }, {
	          start: {
	            line: 119,
	            column: 15
	          },
	          end: {
	            line: 121,
	            column: 9
	          }
	        }],
	        line: 119
	      },
	      '5': {
	        loc: {
	          start: {
	            line: 126,
	            column: 4
	          },
	          end: {
	            line: 131,
	            column: 5
	          }
	        },
	        type: 'if',
	        locations: [{
	          start: {
	            line: 126,
	            column: 4
	          },
	          end: {
	            line: 131,
	            column: 5
	          }
	        }, {
	          start: {
	            line: 126,
	            column: 4
	          },
	          end: {
	            line: 131,
	            column: 5
	          }
	        }],
	        line: 126
	      },
	      '6': {
	        loc: {
	          start: {
	            line: 147,
	            column: 6
	          },
	          end: {
	            line: 149,
	            column: 7
	          }
	        },
	        type: 'if',
	        locations: [{
	          start: {
	            line: 147,
	            column: 6
	          },
	          end: {
	            line: 149,
	            column: 7
	          }
	        }, {
	          start: {
	            line: 147,
	            column: 6
	          },
	          end: {
	            line: 149,
	            column: 7
	          }
	        }],
	        line: 147
	      }
	    },
	    s: {
	      '0': 0,
	      '1': 0,
	      '2': 0,
	      '3': 0,
	      '4': 0,
	      '5': 0,
	      '6': 0,
	      '7': 0,
	      '8': 0,
	      '9': 0,
	      '10': 0,
	      '11': 0,
	      '12': 0,
	      '13': 0,
	      '14': 0,
	      '15': 0,
	      '16': 0,
	      '17': 0,
	      '18': 0,
	      '19': 0,
	      '20': 0,
	      '21': 0,
	      '22': 0,
	      '23': 0,
	      '24': 0,
	      '25': 0,
	      '26': 0,
	      '27': 0,
	      '28': 0,
	      '29': 0,
	      '30': 0,
	      '31': 0,
	      '32': 0,
	      '33': 0,
	      '34': 0,
	      '35': 0,
	      '36': 0,
	      '37': 0,
	      '38': 0,
	      '39': 0,
	      '40': 0,
	      '41': 0
	    },
	    f: {
	      '0': 0,
	      '1': 0,
	      '2': 0,
	      '3': 0,
	      '4': 0
	    },
	    b: {
	      '0': [0, 0],
	      '1': [0, 0],
	      '2': [0, 0],
	      '3': [0, 0],
	      '4': [0, 0],
	      '5': [0, 0],
	      '6': [0, 0]
	    },
	    _coverageSchema: '332fd63041d2c1bcb487cc26dd0d5f7d97098a6c'
	  },
	      coverage = global[gcv] || (global[gcv] = {});

	  if (coverage[path] && coverage[path].hash === hash) {
	    return coverage[path];
	  }

	  coverageData.hash = hash;
	  return coverage[path] = coverageData;
	}();

	var QualityLevelList =
	/*#__PURE__*/
	function (_videojs$EventTarget) {
	  _inheritsLoose(QualityLevelList, _videojs$EventTarget);

	  function QualityLevelList() {
	    var _this;

	    cov_1i6kp4vwyb.f[0]++;
	    cov_1i6kp4vwyb.s[0]++;
	    _this = _videojs$EventTarget.call(this) || this;
	    var list = (cov_1i6kp4vwyb.s[1]++, _assertThisInitialized(_assertThisInitialized(_this)));
	    cov_1i6kp4vwyb.s[2]++;
	    list.levels_ = [];
	    cov_1i6kp4vwyb.s[3]++;
	    list.selectedIndex_ = -1;
	    cov_1i6kp4vwyb.s[4]++;
	    Object.defineProperty(list, 'selectedIndex', {
	      get: function get() {
	        cov_1i6kp4vwyb.s[5]++;
	        return list.selectedIndex_;
	      }
	    });
	    cov_1i6kp4vwyb.s[6]++;
	    Object.defineProperty(list, 'length', {
	      get: function get() {
	        cov_1i6kp4vwyb.s[7]++;
	        return list.levels_.length;
	      }
	    });
	    cov_1i6kp4vwyb.s[8]++;
	    return list || _assertThisInitialized(_this);
	  }

	  var _proto = QualityLevelList.prototype;

	  _proto.addQualityLevel = function addQualityLevel(representation) {
	    cov_1i6kp4vwyb.f[1]++;
	    var qualityLevel = (cov_1i6kp4vwyb.s[9]++, this.getQualityLevelById(representation.id));
	    cov_1i6kp4vwyb.s[10]++;

	    if (qualityLevel) {
	      cov_1i6kp4vwyb.b[0][0]++;
	      cov_1i6kp4vwyb.s[11]++;
	      return qualityLevel;
	    } else {
	      cov_1i6kp4vwyb.b[0][1]++;
	    }

	    var index = (cov_1i6kp4vwyb.s[12]++, this.levels_.length);
	    cov_1i6kp4vwyb.s[13]++;
	    qualityLevel = new QualityLevel(representation);
	    cov_1i6kp4vwyb.s[14]++;

	    if (!('' + index in this)) {
	      cov_1i6kp4vwyb.b[1][0]++;
	      cov_1i6kp4vwyb.s[15]++;
	      Object.defineProperty(this, index, {
	        get: function get() {
	          cov_1i6kp4vwyb.s[16]++;
	          return this.levels_[index];
	        }
	      });
	    } else {
	      cov_1i6kp4vwyb.b[1][1]++;
	    }

	    cov_1i6kp4vwyb.s[17]++;
	    this.levels_.push(qualityLevel);
	    cov_1i6kp4vwyb.s[18]++;
	    this.trigger({
	      qualityLevel: qualityLevel,
	      type: 'addqualitylevel'
	    });
	    cov_1i6kp4vwyb.s[19]++;
	    return qualityLevel;
	  };

	  _proto.removeQualityLevel = function removeQualityLevel(qualityLevel) {
	    cov_1i6kp4vwyb.f[2]++;
	    var removed = (cov_1i6kp4vwyb.s[20]++, null);
	    cov_1i6kp4vwyb.s[21]++;

	    for (var i = 0, l = this.length; i < l; i++) {
	      cov_1i6kp4vwyb.s[22]++;

	      if (this[i] === qualityLevel) {
	        cov_1i6kp4vwyb.b[2][0]++;
	        cov_1i6kp4vwyb.s[23]++;
	        removed = this.levels_.splice(i, 1)[0];
	        cov_1i6kp4vwyb.s[24]++;

	        if (this.selectedIndex_ === i) {
	          cov_1i6kp4vwyb.b[3][0]++;
	          cov_1i6kp4vwyb.s[25]++;
	          this.selectedIndex_ = -1;
	        } else {
	          cov_1i6kp4vwyb.b[3][1]++;
	          cov_1i6kp4vwyb.s[26]++;

	          if (this.selectedIndex_ > i) {
	            cov_1i6kp4vwyb.b[4][0]++;
	            cov_1i6kp4vwyb.s[27]++;
	            this.selectedIndex_--;
	          } else {
	            cov_1i6kp4vwyb.b[4][1]++;
	          }
	        }

	        cov_1i6kp4vwyb.s[28]++;
	        break;
	      } else {
	        cov_1i6kp4vwyb.b[2][1]++;
	      }
	    }

	    cov_1i6kp4vwyb.s[29]++;

	    if (removed) {
	      cov_1i6kp4vwyb.b[5][0]++;
	      cov_1i6kp4vwyb.s[30]++;
	      this.trigger({
	        qualityLevel: qualityLevel,
	        type: 'removequalitylevel'
	      });
	    } else {
	      cov_1i6kp4vwyb.b[5][1]++;
	    }

	    cov_1i6kp4vwyb.s[31]++;
	    return removed;
	  };

	  _proto.getQualityLevelById = function getQualityLevelById(id) {
	    cov_1i6kp4vwyb.f[3]++;
	    cov_1i6kp4vwyb.s[32]++;

	    for (var i = 0, l = this.length; i < l; i++) {
	      var level = (cov_1i6kp4vwyb.s[33]++, this[i]);
	      cov_1i6kp4vwyb.s[34]++;

	      if (level.id === id) {
	        cov_1i6kp4vwyb.b[6][0]++;
	        cov_1i6kp4vwyb.s[35]++;
	        return level;
	      } else {
	        cov_1i6kp4vwyb.b[6][1]++;
	      }
	    }

	    cov_1i6kp4vwyb.s[36]++;
	    return null;
	  };

	  _proto.dispose = function dispose() {
	    cov_1i6kp4vwyb.f[4]++;
	    cov_1i6kp4vwyb.s[37]++;
	    this.selectedIndex_ = -1;
	    cov_1i6kp4vwyb.s[38]++;
	    this.levels_.length = 0;
	  };

	  return QualityLevelList;
	}(videojs.EventTarget);

	cov_1i6kp4vwyb.s[39]++;
	QualityLevelList.prototype.allowedEvents_ = {
	  change: 'change',
	  addqualitylevel: 'addqualitylevel',
	  removequalitylevel: 'removequalitylevel'
	};
	cov_1i6kp4vwyb.s[40]++;

	for (var event in QualityLevelList.prototype.allowedEvents_) {
	  cov_1i6kp4vwyb.s[41]++;
	  QualityLevelList.prototype['on' + event] = null;
	}

	var version = "2.2.1";

	var cov_i8yc0vech = function () {
	  var path = '/Users/poneill/dev/videojs-contrib-quality-levels/src/plugin.js',
	      hash = 'cd96c447c532e38871cc04ce22ce3078bcd6ed97',
	      Function = function () {}.constructor,
	      global = new Function('return this')(),
	      gcv = '__coverage__',
	      coverageData = {
	    path: '/Users/poneill/dev/videojs-contrib-quality-levels/src/plugin.js',
	    statementMap: {
	      '0': {
	        start: {
	          line: 6,
	          column: 23
	        },
	        end: {
	          line: 6,
	          column: 63
	        }
	      },
	      '1': {
	        start: {
	          line: 16,
	          column: 19
	        },
	        end: {
	          line: 33,
	          column: 1
	        }
	      },
	      '2': {
	        start: {
	          line: 17,
	          column: 27
	        },
	        end: {
	          line: 17,
	          column: 47
	        }
	      },
	      '3': {
	        start: {
	          line: 19,
	          column: 27
	        },
	        end: {
	          line: 19,
	          column: 49
	        }
	      },
	      '4': {
	        start: {
	          line: 21,
	          column: 25
	        },
	        end: {
	          line: 25,
	          column: 3
	        }
	      },
	      '5': {
	        start: {
	          line: 22,
	          column: 4
	        },
	        end: {
	          line: 22,
	          column: 31
	        }
	      },
	      '6': {
	        start: {
	          line: 23,
	          column: 4
	        },
	        end: {
	          line: 23,
	          column: 44
	        }
	      },
	      '7': {
	        start: {
	          line: 24,
	          column: 4
	        },
	        end: {
	          line: 24,
	          column: 42
	        }
	      },
	      '8': {
	        start: {
	          line: 27,
	          column: 2
	        },
	        end: {
	          line: 27,
	          column: 39
	        }
	      },
	      '9': {
	        start: {
	          line: 29,
	          column: 2
	        },
	        end: {
	          line: 29,
	          column: 48
	        }
	      },
	      '10': {
	        start: {
	          line: 29,
	          column: 31
	        },
	        end: {
	          line: 29,
	          column: 47
	        }
	      },
	      '11': {
	        start: {
	          line: 30,
	          column: 2
	        },
	        end: {
	          line: 30,
	          column: 41
	        }
	      },
	      '12': {
	        start: {
	          line: 32,
	          column: 2
	        },
	        end: {
	          line: 32,
	          column: 26
	        }
	      },
	      '13': {
	        start: {
	          line: 46,
	          column: 22
	        },
	        end: {
	          line: 48,
	          column: 1
	        }
	      },
	      '14': {
	        start: {
	          line: 47,
	          column: 2
	        },
	        end: {
	          line: 47,
	          column: 61
	        }
	      },
	      '15': {
	        start: {
	          line: 51,
	          column: 0
	        },
	        end: {
	          line: 51,
	          column: 47
	        }
	      },
	      '16': {
	        start: {
	          line: 54,
	          column: 0
	        },
	        end: {
	          line: 54,
	          column: 32
	        }
	      }
	    },
	    fnMap: {
	      '0': {
	        name: '(anonymous_0)',
	        decl: {
	          start: {
	            line: 16,
	            column: 19
	          },
	          end: {
	            line: 16,
	            column: 20
	          }
	        },
	        loc: {
	          start: {
	            line: 16,
	            column: 45
	          },
	          end: {
	            line: 33,
	            column: 1
	          }
	        },
	        line: 16
	      },
	      '1': {
	        name: '(anonymous_1)',
	        decl: {
	          start: {
	            line: 21,
	            column: 25
	          },
	          end: {
	            line: 21,
	            column: 26
	          }
	        },
	        loc: {
	          start: {
	            line: 21,
	            column: 36
	          },
	          end: {
	            line: 25,
	            column: 3
	          }
	        },
	        line: 21
	      },
	      '2': {
	        name: '(anonymous_2)',
	        decl: {
	          start: {
	            line: 29,
	            column: 25
	          },
	          end: {
	            line: 29,
	            column: 26
	          }
	        },
	        loc: {
	          start: {
	            line: 29,
	            column: 31
	          },
	          end: {
	            line: 29,
	            column: 47
	          }
	        },
	        line: 29
	      },
	      '3': {
	        name: '(anonymous_3)',
	        decl: {
	          start: {
	            line: 46,
	            column: 22
	          },
	          end: {
	            line: 46,
	            column: 23
	          }
	        },
	        loc: {
	          start: {
	            line: 46,
	            column: 40
	          },
	          end: {
	            line: 48,
	            column: 1
	          }
	        },
	        line: 46
	      }
	    },
	    branchMap: {
	      '0': {
	        loc: {
	          start: {
	            line: 6,
	            column: 23
	          },
	          end: {
	            line: 6,
	            column: 63
	          }
	        },
	        type: 'binary-expr',
	        locations: [{
	          start: {
	            line: 6,
	            column: 23
	          },
	          end: {
	            line: 6,
	            column: 45
	          }
	        }, {
	          start: {
	            line: 6,
	            column: 49
	          },
	          end: {
	            line: 6,
	            column: 63
	          }
	        }],
	        line: 6
	      }
	    },
	    s: {
	      '0': 0,
	      '1': 0,
	      '2': 0,
	      '3': 0,
	      '4': 0,
	      '5': 0,
	      '6': 0,
	      '7': 0,
	      '8': 0,
	      '9': 0,
	      '10': 0,
	      '11': 0,
	      '12': 0,
	      '13': 0,
	      '14': 0,
	      '15': 0,
	      '16': 0
	    },
	    f: {
	      '0': 0,
	      '1': 0,
	      '2': 0,
	      '3': 0
	    },
	    b: {
	      '0': [0, 0]
	    },
	    _coverageSchema: '332fd63041d2c1bcb487cc26dd0d5f7d97098a6c'
	  },
	      coverage = global[gcv] || (global[gcv] = {});

	  if (coverage[path] && coverage[path].hash === hash) {
	    return coverage[path];
	  }

	  coverageData.hash = hash;
	  return coverage[path] = coverageData;
	}();
	var registerPlugin = (cov_i8yc0vech.s[0]++, (cov_i8yc0vech.b[0][0]++, videojs.registerPlugin) || (cov_i8yc0vech.b[0][1]++, videojs.plugin));
	cov_i8yc0vech.s[1]++;

	var initPlugin = function initPlugin(player, options) {
	  cov_i8yc0vech.f[0]++;
	  var originalPluginFn = (cov_i8yc0vech.s[2]++, player.qualityLevels);
	  var qualityLevelList = (cov_i8yc0vech.s[3]++, new QualityLevelList());
	  cov_i8yc0vech.s[4]++;

	  var disposeHandler = function disposeHandler() {
	    cov_i8yc0vech.f[1]++;
	    cov_i8yc0vech.s[5]++;
	    qualityLevelList.dispose();
	    cov_i8yc0vech.s[6]++;
	    player.qualityLevels = originalPluginFn;
	    cov_i8yc0vech.s[7]++;
	    player.off('dispose', disposeHandler);
	  };

	  cov_i8yc0vech.s[8]++;
	  player.on('dispose', disposeHandler);
	  cov_i8yc0vech.s[9]++;

	  player.qualityLevels = function () {
	    cov_i8yc0vech.f[2]++;
	    cov_i8yc0vech.s[10]++;
	    return qualityLevelList;
	  };

	  cov_i8yc0vech.s[11]++;
	  player.qualityLevels.VERSION = version;
	  cov_i8yc0vech.s[12]++;
	  return qualityLevelList;
	};

	cov_i8yc0vech.s[13]++;

	var qualityLevels = function qualityLevels(options) {
	  cov_i8yc0vech.f[3]++;
	  cov_i8yc0vech.s[14]++;
	  return initPlugin(this, videojs.mergeOptions({}, options));
	};

	cov_i8yc0vech.s[15]++;
	registerPlugin('qualityLevels', qualityLevels);
	cov_i8yc0vech.s[16]++;
	qualityLevels.VERSION = version;

	var Player = videojs.getComponent('Player');
	QUnit.test('the environment is sane', function (assert) {
	  assert.strictEqual(typeof Array.isArray, 'function', 'es5 exists');
	  assert.strictEqual(typeof sinon, 'object', 'sinon exists');
	  assert.strictEqual(typeof videojs, 'function', 'videojs exists');
	  assert.strictEqual(typeof qualityLevels, 'function', 'plugin is a function');
	});
	QUnit.module('videojs-contrib-quality-levels', {
	  beforeEach: function beforeEach() {
	    // Mock the environment's timers because certain things - particularly
	    // player readiness - are asynchronous in video.js 5. This MUST come
	    // before any player is created; otherwise, timers could get created
	    // with the actual timer methods!
	    this.clock = sinon.useFakeTimers();
	    this.fixture = document_1.getElementById('qunit-fixture');
	    this.video = document_1.createElement('video');
	    this.fixture.appendChild(this.video);
	    this.player = videojs(this.video);
	  },
	  afterEach: function afterEach() {
	    this.player.dispose();
	    this.clock.restore();
	  }
	});
	QUnit.test('registers itself with video.js', function (assert) {
	  assert.strictEqual(typeof Player.prototype.qualityLevels, 'function', 'videojs-contrib-quality-levels plugin was registered');
	});

	var representations = [{
	  id: '0',
	  width: 100,
	  height: 100,
	  bandwidth: 100,
	  frameRate: 29.956,
	  enabled: function enabled() {
	    return true;
	  }
	}, {
	  id: '1',
	  width: 200,
	  height: 200,
	  bandwidth: 200,
	  frameRate: 29.956,
	  enabled: function enabled() {
	    return true;
	  }
	}, {
	  id: '2',
	  width: 300,
	  height: 300,
	  bandwidth: 300,
	  frameRate: 30,
	  enabled: function enabled() {
	    return true;
	  }
	}, {
	  id: '3',
	  width: 400,
	  height: 400,
	  bandwidth: 400,
	  frameRate: 60,
	  enabled: function enabled() {
	    return true;
	  }
	}];

	QUnit.module('QualityLevelList', {
	  beforeEach: function beforeEach() {
	    this.qualityLevels = new QualityLevelList();
	    this.levels = representations;
	  }
	});
	QUnit.test('Properly adds QualityLevels to the QualityLevelList', function (assert) {
	  var addCount = 0;
	  this.qualityLevels.on('addqualitylevel', function (event) {
	    addCount++;
	  });
	  var expected0 = this.qualityLevels.addQualityLevel(this.levels[0]);
	  assert.equal(this.qualityLevels.length, 1, 'added quality level');
	  assert.equal(addCount, 1, 'emmitted addqualitylevel event');
	  assert.strictEqual(this.qualityLevels[0], expected0, 'can access quality level with index');
	  var expected1 = this.qualityLevels.addQualityLevel(this.levels[1]);
	  assert.equal(this.qualityLevels.length, 2, 'added quality level');
	  assert.equal(addCount, 2, 'emmitted addqualitylevel event');
	  assert.strictEqual(this.qualityLevels[1], expected1, 'can access quality level with index');
	  var expectedDuplicate = this.qualityLevels.addQualityLevel(this.levels[0]);
	  assert.equal(this.qualityLevels.length, 2, 'does not add duplicate quality level');
	  assert.equal(addCount, 2, 'no event emitted on dulicate');
	  assert.strictEqual(this.qualityLevels[3], undefined, 'no index property defined');
	  assert.strictEqual(this.qualityLevels[0], expected0, 'quality level unchanged');
	  assert.strictEqual(this.qualityLevels[0], expectedDuplicate, 'adding duplicate returns same reference');
	  assert.strictEqual(this.qualityLevels[1], expected1, 'quality level unchanged');
	});
	QUnit.test('Properly removes QualityLevels from the QualityLevelList', function (assert) {
	  var _this = this;

	  var removeCount = 0;
	  var expected = [];
	  this.levels.forEach(function (qualityLevel) {
	    expected.push(_this.qualityLevels.addQualityLevel(qualityLevel));
	  });
	  this.qualityLevels.on('removequalitylevel', function (event) {
	    removeCount++;
	  }); // Mock an initial selected quality level

	  this.qualityLevels.selectedIndex_ = 2;
	  assert.equal(this.qualityLevels.length, 4, '4 initial quality levels');
	  var removed = this.qualityLevels.removeQualityLevel(expected[3]);
	  assert.equal(this.qualityLevels.length, 3, 'removed quality level');
	  assert.equal(removeCount, 1, 'emitted removequalitylevel event');
	  assert.strictEqual(removed, expected[3], 'returned removed level');
	  assert.notStrictEqual(this.qualityLevels[3], expected[3], 'nothing at index');
	  removed = this.qualityLevels.removeQualityLevel(expected[1]);
	  assert.equal(this.qualityLevels.length, 2, 'removed quality level');
	  assert.equal(removeCount, 2, 'emitted removequalitylevel event');
	  assert.strictEqual(removed, expected[1], 'returned removed level');
	  assert.notStrictEqual(this.qualityLevels[1], expected[1], 'quality level not at index');
	  assert.strictEqual(this.qualityLevels[this.qualityLevels.selectedIndex], expected[2], 'selected index properly adjusted on quality level removal');
	  removed = this.qualityLevels.removeQualityLevel(expected[3]);
	  assert.equal(this.qualityLevels.length, 2, 'no quality level removed if not found');
	  assert.equal(removed, null, 'returned null when nothing removed');
	  assert.equal(removeCount, 2, 'no event emitted when quality level not found');
	  removed = this.qualityLevels.removeQualityLevel(expected[2]);
	  assert.equal(this.qualityLevels.length, 1, 'quality level removed');
	  assert.equal(removeCount, 3, 'emitted removequalitylevel event');
	  assert.strictEqual(removed, expected[2], 'returned removed level');
	  assert.equal(this.qualityLevels.selectedIndex, -1, 'selectedIndex set to -1 when removing selected quality level');
	});
	QUnit.test('can get quality level by id', function (assert) {
	  var _this2 = this;

	  var expected = [];
	  this.levels.forEach(function (qualityLevel) {
	    expected.push(_this2.qualityLevels.addQualityLevel(qualityLevel));
	  });
	  assert.strictEqual(this.qualityLevels.getQualityLevelById('0'), expected[0], 'found quality level with id "0"');
	  assert.strictEqual(this.qualityLevels.getQualityLevelById('1'), expected[1], 'found quality level with id "1"');
	  assert.strictEqual(this.qualityLevels.getQualityLevelById('2'), expected[2], 'found quality level with id "2"');
	  assert.strictEqual(this.qualityLevels.getQualityLevelById('3'), expected[3], 'found quality level with id "3"');
	  assert.strictEqual(this.qualityLevels.getQualityLevelById('4'), null, 'no quality level with id "4" found');
	});

}(videojs,QUnit,sinon));
