(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global = typeof globalThis !== 'undefined' ? globalThis : global || self, global.Utils = factory());
}(this, (function () { 'use strict';

	function isArray (arr) {
		return arr && typeof arr === 'object' && 'length' in arr
	}

	function isFunction (fn) {
		return fn && typeof fn === 'function';
	}

	function isObject (obj) {
		return obj && typeof obj === 'object' && !obj.length;
	}

	function each (agg, fn) {
		var _fn = true;
		if (!agg || !isFunction(fn)) return;

		if (isArray(agg)) {
			for (var i = 0; i < agg.length; i++) {
				_fn = fn(agg[i], i);
				if (_fn !== undefined && _fn === false) break;
			}
		}

		if (isObject(agg)) {
			var index = 0;
			for (var k in agg) {
				_fn = fn(agg[k], k, index++);
				if (_fn !== undefined && _fn === false) break;
			}
		}
	}

	function adapt (obj, lut) {
		return each(obj, function (res, val, key) {
			res[lut[key] || key] = val;
		})
	}

	function isString (str) {
		return str && typeof str === 'string';
	}

	function split (str, s) {
		if (!str || !isString(str)) return [];
		return str.split(s)
	}

	function indexOf (agg, target) {
		var res = -1;

		if (agg !== 'undefined' && target !== 'undefined') {
			if (isFunction(target)) each(agg, function (val, index) {
				res = index;
				if (target(val, index)) return false;
			});
			else res = agg.indexOf(target);
		}

		return res;
	}

	function camelCase (str) {
		var strIn;
		each(['-', '_', '~', '@', '+'], function (spt) {
			if (indexOf(str, spt) > -1) {
				strIn = split(str, spt);
				return false
			}
		});

		var strOut = '';
		each(strIn, function (val, index) {
			strOut += (index !== 0 ? val.replace(val[0], val[0].toUpperCase()) : val);
		});

		return strOut
	}

	function clone (obj) {
	    var res = new obj.constructor;

	    function run(org, target) {
	        var i, k;

	        function a(k) {
	            var v = org[k];
	            var constructor = v.constructor;
	            if (typeof v === 'object') {
	                target[k] = new constructor;
	                run(v, target[k]);
	            }
	            else target[k] = v;
	        }

	        if ('length' in org) for (i = 0; i < org.length; i++) a(i);
	        else for (k in org) a(k);
	    }

	    run(obj, res);

	    return res;
	}

	function compact (arr) {
		var __arr = [];

		each(arr, function (val) {
			if (!!val) __arr.push(val);
		});

		return __arr;
	}

	/**
	 * 判断实体是否为空
	 * @param ogg object|array|number|string
	 * @returns {boolean}
	 */
	function isEmpty (ogg) {
		if (!ogg) return true;
		if (typeof ogg === 'object') return Object.keys(ogg).length === 0;
		else return typeof ogg === 'string' ? ogg.length === 0 : ogg === 0;
	}

	/**
	 * 检查属性是否值都是真
	 * @param obj	被检查的对象
	 * @param keys	被检查的属性
	 * @returns {boolean}
	 */
	function complete (obj, keys) {
		var affirm = true;

		function empty(item) {
			return (typeof item === 'object') ? isEmpty(item) : (item === 0 ? false : !item)
		}

		each(keys || obj, function (val) {
			if (keys ? empty(obj[val]) : empty(val)) {
				affirm = false;
				return false;
			}
		});

		return affirm
	}

	function keys(obj) {
		return typeof obj === 'object' ? Object.keys(obj) : [];
	}

	function size (agg) {
		return agg ? (isObject(agg) ? keys(agg).length : agg.length) : 0;
	}

	//注意务必传入可枚举的对象

	function equal (agg1, agg2) {
		var res = true;
		if (typeof agg1 !== typeof agg2) return false;
		if (isObject(agg1) || isArray(agg1)) {
			if (size(keys(agg1)) !== size(keys(agg2))) return false;
			else each(agg1, function (val, key) {
				if (val !== agg2[key]) {
					res = false;
					return false;
				}
			});
		}
		else res = (agg1 === agg2);

		return res
	}

	function escape2Html (str) {
		var arrEntities = {'lt': '<', 'gt': '>', 'nbsp': ' ', 'amp': '&', 'quot': '"'};
		return str.replace(/&(lt|gt|nbsp|amp|quot);/ig, function (all, t) {
			return arrEntities[t];
		});
	}

	function extend (a, b) {
		each(b, function (val, key) {
			a[key] = val;
		});

		return a;
	}

	function transform (agg, fn, res) {
		each(agg, function (val, key, index) {
			var _is = fn.call(null, val, key, res, index);
			return _is !== 'undefined' ? _is : true
		});
		return res
	}

	//区别于lodash 这个可以查找对象并把符合条件的键值组成新对象返回

	/**
	 * 筛选结果
	 * Utils.data.filter([{a:{b:1},c:{}},{a:{b:2},c:[]}],function(item){return item.a.b===1})
	 * @param agg    对象或数组
	 * @param target    搜选的条件
	 * @param limit    长度限制，也就是最多可以查找多少个结果
	 */
	function filter (agg, target, limit) {
		var index = 0;
		return transform(agg, function (item, key, res) {
			if (limit === index) return false;
			var has;
			if (isFunction(target)) has = target(item, key);
			else if (isArray(target) && target[0] === key) has = item === target[1];
			else has = equal(target[key], item);

			if (has) {
				if (isArray(res)) res.push(item);
				else res[key] = item;

				index++;
			}
		}, isArray(agg) ? [] : {})
	}

	function find (agg, target) {
		return filter(agg, target, 1)
	}

	function findKey (agg, target) {
		return isObject(agg) ? keys(filter(agg, target, 1))[0] : null
	}

	function get (target, path) {
		if (!target || !path) return target;
		var _t = target,
			_p = String(path).split('.');

		for (var i = 0; i < _p.length; i++) {
			_t = _t[_p[i]];
			if (!_t) break;
		}

		return _t;
	}

	function html2Escape (sHtml) {
		return sHtml.replace(/[<>&"]/g, function (c) {
			return {'<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;'}[c];
		});
	}

	function htmlDecode (str) {
		return str ? str.replace(/&((g|l|quo)t|amp|#39|nbsp);/g, function (m) {
			return {
				'&lt;': '<',
				'&amp;': '&',
				'&quot;': '"',
				'&gt;': '>',
				'&#39;': "'",
				'&nbsp;': ' '
			}[m]
		}) : '';
	}

	function htmlEncode (str, reg) {
		return str ? str.replace(reg || /[&<">'](?:(amp|lt|quot|gt|#39|nbsp|#\d+);)?/g, function (a, b) {
			if (b) {
				return a;
			} else {
				return {
					'<': '&lt;',
					'&': '&amp;',
					'"': '&quot;',
					'>': '&gt;',
					"'": '&#39;'
				}[a]
			}

		}) : '';
	}

	/**
	 * 判断数组中是否存在某个值
	 * 区别于lodash target可以传入函数当作条件
	 */

	function includes (arr, target) {
		var __has = false;

		each(arr, function (val) {
			if (isFunction(target) && target(val)) __has = true;
			else if (target === val) __has = true;

			if (__has) return false;
		});

		return __has;
	}

	function keysBy (obj, target) {
		return keys(filter(obj, target));
	}

	function loop (tickFn, stepTime) {
		var interval, step = stepTime || 200;

		function stop() {
			clearInterval(interval);
		}

		interval = setInterval(function () {
			tickFn(stop);
		}, step);

		return interval
	}

	function mergeSpace (str) {
		str = str.replace(/(\s|&nbsp;)+/g, ' ');
		return str;
	}

	function move (arr, index, targetIndex) {
		var call = arr[index];
		arr.splice(index, 1);
		arr.splice(targetIndex, 0, call);
		return arr;
	}

	/**
	 * 将空格转义符转回正常的空格
	 * @param str
	 */
	function nbsp2Space (str) {
		var arrEntities = {'nbsp': ' '};
		return str.replace(/&(nbsp);/ig, function (all, t) {
			return arrEntities[t]
		})
	}

	function pick (obj, arr, reject) {
		var o = {};

		if (reject) each(obj, function (val, key) {
			if (arr.indexOf(key) < 0) o[key] = val;
		});
		else each(arr, function (val) {
			o[val] = obj[val];
		});

		return o;
	}

	function pickBy (obj, target) {
		return filter(obj, target)
	}

	function remove (agg, index) {
		var dx = agg[index];
		if (isArray(agg)) agg.splice(index, 1);
		else delete agg[index];
		return dx;
	}

	/**
	 * 删除html中的HTML标签
	 * @param tab html字符实体
	 */
	function removeHtmlTab (tab) {
		return tab.replace(/<[^<>]+?>/g, '');
	}

	/**
	 * html字符实体的所有换行符转为html标签
	 * @param str
	 */
	function return2Br (str) {
		return str.replace(/\r?\n/g, "<br />");
	}

	function strIndexOf (agg, str) {
		var res;

		each(agg, function (val, index) {
			if (val.indexOf(str) > -1) {
				res = index;
				return false;
			}
		});
		
		return res;
	}

	function timer (time, tickFn, step) {
		var interval, _step = (typeof step !== 'undefined') ? step : 1000;

		function stop() {
			clearInterval(interval);
		}

		interval = setInterval(function () {
			if (time < _step) stop();
			tickFn(time, stop);
			time -= _step;
		}, _step);

		return interval;
	}

	function trimBr (str) {
		str = str.replace(/((\s|&nbsp;)*\r?\n){3,}/g, "\r\n\r\n");//限制最多2次换行
		str = str.replace(/^((\s|&nbsp;)*\r?\n)+/g, '');//清除开头换行
		str = str.replace(/((\s|&nbsp;)*\r?\n)+$/g, '');//清除结尾换行
		return str;
	}

	function uniq (arr) {
		var __arr = [];

		each(arr, function (val) {
			if (!includes(__arr, val)) __arr.push(val);
		});

		return __arr;
	}

	var data = {
		adapt,
		camelCase,
		clone,
		compact,
		complete,
		each,
		equal,
		escape2Html,
		extend,
		filter,
		find,
		findKey,
		get,
		html2Escape,
		htmlDecode,
		htmlEncode,
		includes,
		indexOf,
		isArray,
		isEmpty,
		isFunction,
		isObject,
		isString,
		keys,
		keysBy,
		loop,
		mergeSpace,
		move,
		nbsp2Space,
		pick,
		pickBy,
		remove,
		removeHtmlTab,
		return2Br,
		size,
		split,
		strIndexOf,
		timer,
		transform,
		trimBr,
		uniq,
	};

	function setAttrs (el, attach) {
		var _k, _i;
		for (_k in attach) {
			if (_k === 'style' && typeof attach[_k] === 'object') for (_i in attach[_k]) el.style[_k] = attach[_k][_i];
			else el.setAttribute(_k, attach[_k]);
		}
		return el
	}

	function setHtml (el, html) {
		el.innerHTML = html;
		return el
	}

	/**
	 * 创建html元素实例万能方法
	 *  也就是说，除第一个参数是必须的，还可以传入三个附加参数，只要保持参数的类型，参数次序随意。
	 *  	object	表示附加到元素上的属性 style属性支持两种格式：字符串|对象
	 *  	array	表示子元素
	 *  	string	表示元素内文本
	 *  测试
	 *  appendTo(createEl('<div id="lihong"></div>',{class:'active'},[createEl('button','test'),createEl('button','test')],'666666'),getEl('body'))
	 * @param tagName 标签名|html
	 * @returns {Element}
	 */
	function createEl (tagName) {
		//处理tagName 创建el
		var _i, _k;
		var _isTag = tagName.length < 10 && (!tagName.match(/</));
		var __el__ = document.createElement(_isTag ? tagName : 'div');
		var _el = _isTag ? __el__ : (setHtml(__el__, tagName).children || [])[0];
		if (!_isTag) __el__.remove();

		//附加项
		var _temp, _props, _children, _text;
		for (_i = 0; _i < arguments.length; _i++) {
			if (_i === 0) continue;
			_temp = arguments[_i];
			if(typeof _temp === 'object'){
				if('length' in _temp) _children = _temp;
				else _props = _temp;
			}
			else _text = _temp;
		}

		if (_text) _el.innerText = _text;
		if (_props) setAttrs(_el, _props);
		if (_children) for (_k = 0; _k < _children.length; _k++) _el.appendChild(_children[_k]);

		return _el;
	}

	function cloneEl (el, deep) {
		return el.cloneNode(!!deep);
	}

	function removeEl (el) {
		return el.remove();
	}

	function appendTo (el, wrap) {
		wrap.appendChild(el);
		return el;
	}

	function getEl (el, slt) {
		var __slt = slt ? slt : el;
		var __el = slt ? el : document;
		return __el.querySelector(__slt)
	}

	function tempAppend (el, fn) {
		var temp = createEl('div');
		temp.style.display = 'none';
		appendTo(el, temp);
		appendTo(temp, getEl('body'));
		fn();
		temp.remove();
	}

	function setHtmlOuter (el, html) {
		el.outerHTML = html;
		return el
	}

	function setAttr (el, attrName, value) {
		el.setAttribute(attrName, value);
		return el
	}

	function setCss (text) {
		var styleEl = createEl('style');
		setHtml(styleEl, text);
		appendTo(styleEl, getEl('head'));
	}

	function addClass (el, className) {
		if ((typeof el === 'object') && ('length' in el)) el.forEach(function (item) {
			item.classList.add(className);
		});
		else el.classList.add(className);
		return el;
	}

	function setStyle (el, style) {
		for (var _k in style) {
			el.style[_k] = style[_k];
		}

		return el;
	}

	function removeAttr (el, attrName) {
		el.removeAttribute(attrName);
		return el;
	}

	function removeClass (el, className) {
		if ((typeof el === 'object') && ('length' in el)) {
			el.forEach(function (item) {
				item.classList.remove(className);
			});
		}
		else el.classList.remove(className);
		return el;
	}

	/**
	 * appendChild的别名函数
	 * 允许一次性追加多个元素
	 * @param el 容器
	 * @returns {*}
	 */
	function append (el) {
		var _i;
		for (_i = 0; _i < arguments.length; _i++) {
			if (_i === 0) continue;
			el.appendChild(arguments[_i]);
		}

		return el;
	}

	/**
	 * 插入元素到目标元素前面
	 * https://blog.csdn.net/csdnlinyongsheng/article/details/99960935
	 * 测试 aa = createEl('div','123456');append(getEl('body'),aa);insertBefore(aa,createEl('div','789'),true);
	 * @param el
	 * @param son
	 * @param inner
	 * @returns {*}
	 */
	function insertBefore (el, son, inner) {
		var _children = el.firstChild;
		var _el = inner ? _children : el;
		if (!_children) el.appendChild(son);
		else _el.parentNode.insertBefore(son, _el);
		return el;
	}

	/**
	 * 插入元素到目标元素后面
	 * 测试 aa = createEl('div','123456');append(getEl('body'),aa);insertAfter(aa,createEl('div','789'));
	 * @param el
	 * @param son
	 * @param inner
	 * @returns {*}
	 */
	function insertAfter (el, son, inner) {
		if (inner) el.appendChild(son);
		else el.parentNode.insertBefore(son, el.nextSibling);
		return el;
	}

	function getElAll (el, slt) {
		var __slt = slt ? slt : el;
		var __el = slt ? el : document;
		return __el.querySelectorAll(__slt)
	}

	function getHtml (el) {
		return el.innerHTML
	}

	function getHtmlOuter (el) {
		return el.outerHTML
	}

	/**
	 * 获取元素的子元素列表
	 * @param el
	 * @returns {children|jQuery.children|boolean|*|HTMLElement[]}
	 */
	function getChildren (el) {
		return el.children
	}

	function getAttr (el, attrName) {
		return el.getAttribute(attrName)
	}

	function getWidth (el, inner) {
		return inner ? el.clientWidth : el.offsetWidth
	}

	function getHeight (el, inner) {
		return inner ? el.clientHeight : el.offsetHeight
	}

	//增删改

	var dom = {
		createEl,
		cloneEl,
		removeEl,
		appendTo,
		tempAppend,
		setHtmlOuter,
		setAttr,
		setStyle,
		setCss,
		addClass,
		removeAttr,
		removeClass,
		getEl,
		getElAll,
		getHtml,
		getHtmlOuter,
		getChildren,
		getAttr,
		setHtml,
		append,
		insertBefore,
		insertAfter,
		setAttrs,
		getWidth,
		getHeight
	};

	function addHandler(element, type, handler) { //添加事件
		if (element.addEventListener) {
			element.addEventListener(type, handler, false);  //使用DOM2级方法添加事件
		} else if (element.attachEvent) {                    //使用IE方法添加事件
			element.attachEvent("on" + type, handler);
		} else {
			element["on" + type] = handler;          //使用DOM0级方法添加事件
		}
	}

	function removeHandler (element, type, handler) {  //取消事件
		if (element.removeEventListener) {
			element.removeEventListener(type, handler, false);
		} else if (element.detachEvent) {
			element.detachEvent("on" + type, handler);
		} else {
			element["on" + type] = null;
		}
	}

	function getEvent (event) {  //使用这个方法跨浏览器取得event对象
		return event ? event : window.event;
	}

	function getTarget (event) {  //返回事件的实际目标
		return event.target || event.srcElement;
	}

	function preventDefault (event) {   //阻止事件的默认行为
		if (event.preventDefault) {
			event.preventDefault();
		} else {
			event.returnValue = false;
		}
	}

	function stopPropagation(event) {
		//立即停止事件在DOM中的传播
		//避免触发注册在document.body上面的事件处理程序
		if (event.stopPropagation) {
			event.stopPropagation();
		} else {
			event.cancelBubble = true;
		}
	}

	function getRelatedTarget (event) {
		//获取mouseover和mouseout相关元素
		if (event.relatedTarget) {
			return event.relatedTarget;
		} else if (event.toElement) {      //兼容IE8-
			return event.toElement;
		} else if (event.formElement) {
			return event.formElement;
		} else {
			return null;
		}
	}

	function getButton (event) {
		//获取mousedown或mouseup按下或释放的按钮是鼠标中的哪一个
		if (document.implementation.hasFeature("MouseEvents", "2.0")) {
			return event.button;
		} else {
			switch (event.button) {
				//将IE模型下的button属性映射为DOM模型下的button属性
				case 0:
				case 1:
				case 3:
				case 5:
				case 7:
					return 0;  //按下的是鼠标主按钮（一般是左键）
				case 2:
				case 6:
					return 2;  //按下的是中间的鼠标按钮
				case 4:
					return 1;  //鼠标次按钮（一般是右键）
			}
		}
	}

	function getWheelDelta (event) {
		//获取表示鼠标滚轮滚动方向的数值
		if (event.wheelDelta) {
			return event.wheelDelta;
		} else {
			return -event.detail * 40;
		}
	}

	function getCharCode (event) {
		//以跨浏览器取得相同的字符编码，需在keypress事件中使用
		if (typeof event.charCode == "number") {
			return event.charCode;
		} else {
			return event.keyCode;
		}
	}

	var event = {
		addHandler,
		removeHandler,
		getEvent,
		getTarget,
		preventDefault,
		stopPropagation,
		getRelatedTarget,
		getButton,
		getWheelDelta,
		getCharCode
	};

	/**
	 * 装载工具
	 * @param ogg    要装载的对象
	 * @param target    装载的目标对象  选填，不填则直接装载到局部函数内部
	 * @param pick    要装载的函数    选题，不填则全部装载
	 */
	function setup (ogg, target, pick) {
		each(pick || ogg, function (v, k) {
			var __v = pick ? ogg[v] : v;
			var __k = pick ? v : k;
			target[__k] = __v;
		});
	}

	var index = {
		data,
		dom,
		event,
		setup
	};

	return index;

})));
