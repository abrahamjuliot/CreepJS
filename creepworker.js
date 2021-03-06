const getFirefox = () => 3.141592653589793 ** -100 == 1.9275814160560185e-50

const getPrototypeLies = globalScope => {
	// Lie Tests

	// object constructor descriptor should return undefined properties
	const getUndefinedValueLie = (obj, name) => {
		const objName = obj.name
		const objNameUncapitalized = window[objName.charAt(0).toLowerCase() + objName.slice(1)]
		const hasInvalidValue = !!objNameUncapitalized && (
			typeof Object.getOwnPropertyDescriptor(objNameUncapitalized, name) != 'undefined' ||
			typeof Reflect.getOwnPropertyDescriptor(objNameUncapitalized, name) != 'undefined'
		)
		return hasInvalidValue ? true : false
	}

	// accessing the property from the prototype should throw a TypeError
	const getIllegalTypeErrorLie = (obj, name) => {
		const proto = obj.prototype
		try {
			proto[name]
			return true
		} catch (error) {
			return error.constructor.name != 'TypeError' ? true : false
		}
		const illegal = [
			'',
			'is',
			'call',
			'seal',
			'keys',
			'bind',
			'apply',
			'assign',
			'freeze',
			'values',
			'entries',
			'toString',
			'isFrozen',
			'isSealed',
			'constructor',
			'isExtensible',
			'getPrototypeOf',
			'preventExtensions',
			'propertyIsEnumerable',
			'getOwnPropertySymbols',
			'getOwnPropertyDescriptors'
		]
		const lied = !!illegal.find(prop => {
			try {
				prop == '' ? Object(proto[name]) : Object[prop](proto[name])
				return true
			} catch (error) {
				return error.constructor.name != 'TypeError' ? true : false
			}
		})
		return lied
	}

	// calling the interface prototype on the function should throw a TypeError
	const getCallInterfaceTypeErrorLie = (apiFunction, proto) => {
		try {
			new apiFunction()
			apiFunction.call(proto)
			return true
		} catch (error) {
			return error.constructor.name != 'TypeError' ? true : false
		}
	}

	// applying the interface prototype on the function should throw a TypeError
	const getApplyInterfaceTypeErrorLie = (apiFunction, proto) => {
		try {
			new apiFunction()
			apiFunction.apply(proto)
			return true
		} catch (error) {
			return error.constructor.name != 'TypeError' ? true : false
		}
	}

	// creating a new instance of the function should throw a TypeError
	const getNewInstanceTypeErrorLie = apiFunction => {
		try {
			new apiFunction()
			return true
		} catch (error) {
			return error.constructor.name != 'TypeError' ? true : false
		}
	}

	// extending the function on a fake class should throw a TypeError and message "not a constructor"
	const getClassExtendsTypeErrorLie = apiFunction => {
		try {
			class Fake extends apiFunction { }
			return true
		} catch (error) {
			// Native has TypeError and 'not a constructor' message in FF & Chrome
			return error.constructor.name != 'TypeError' ? true :
				!/not a constructor/i.test(error.message) ? true : false
		}
	}

	// setting prototype to null and converting to a string should throw a TypeError
	const getNullConversionTypeErrorLie = apiFunction => {
		const nativeProto = Object.getPrototypeOf(apiFunction)
		try {
			Object.setPrototypeOf(apiFunction, null) + ''
			return true
		} catch (error) {
			return error.constructor.name != 'TypeError' ? true : false
		} finally {
			// restore proto
			Object.setPrototypeOf(apiFunction, nativeProto)
		}
	}

	// toString() and toString.toString() should return a native string in all frames
	const getToStringLie = (apiFunction, name, globalScope) => {
        /*
        Accepted strings:
        'function name() { [native code] }'
        'function name() {\n    [native code]\n}'
        'function get name() { [native code] }'
        'function get name() {\n    [native code]\n}'
        'function () { [native code] }'
        `function () {\n    [native code]\n}`
        */
		let iframeToString, iframeToStringToString
		try {
			iframeToString = globalScope.Function.prototype.toString.call(apiFunction)
		} catch (e) { }
		try {
			iframeToStringToString = globalScope.Function.prototype.toString.call(apiFunction.toString)
		} catch (e) { }

		const apiFunctionToString = (
			iframeToString ?
				iframeToString :
				apiFunction.toString()
		)
		const apiFunctionToStringToString = (
			iframeToStringToString ?
				iframeToStringToString :
				apiFunction.toString.toString()
		)
		const trust = name => ({
			[`function ${name}() { [native code] }`]: true,
			[`function get ${name}() { [native code] }`]: true,
			[`function () { [native code] }`]: true,
			[`function ${name}() {${'\n'}    [native code]${'\n'}}`]: true,
			[`function get ${name}() {${'\n'}    [native code]${'\n'}}`]: true,
			[`function () {${'\n'}    [native code]${'\n'}}`]: true
		})
		return (
			!trust(name)[apiFunctionToString] ||
			!trust('toString')[apiFunctionToStringToString]
		)
	}

	// "prototype" in function should not exist
	const getPrototypeInFunctionLie = apiFunction => 'prototype' in apiFunction ? true : false

	// "arguments", "caller", "prototype", "toString"  should not exist in descriptor
	const getDescriptorLie = apiFunction => {
		const hasInvalidDescriptor = (
			!!Object.getOwnPropertyDescriptor(apiFunction, 'arguments') ||
			!!Reflect.getOwnPropertyDescriptor(apiFunction, 'arguments') ||
			!!Object.getOwnPropertyDescriptor(apiFunction, 'caller') ||
			!!Reflect.getOwnPropertyDescriptor(apiFunction, 'caller') ||
			!!Object.getOwnPropertyDescriptor(apiFunction, 'prototype') ||
			!!Reflect.getOwnPropertyDescriptor(apiFunction, 'prototype') ||
			!!Object.getOwnPropertyDescriptor(apiFunction, 'toString') ||
			!!Reflect.getOwnPropertyDescriptor(apiFunction, 'toString')
		)
		return hasInvalidDescriptor ? true : false
	}

	// "arguments", "caller", "prototype", "toString" should not exist as own property
	const getOwnPropertyLie = apiFunction => {
		const hasInvalidOwnProperty = (
			apiFunction.hasOwnProperty('arguments') ||
			apiFunction.hasOwnProperty('caller') ||
			apiFunction.hasOwnProperty('prototype') ||
			apiFunction.hasOwnProperty('toString')
		)
		return hasInvalidOwnProperty ? true : false
	}

	// descriptor keys should only contain "name" and "length"
	const getDescriptorKeysLie = apiFunction => {
		const descriptorKeys = Object.keys(Object.getOwnPropertyDescriptors(apiFunction))
		const hasInvalidKeys = '' + descriptorKeys != 'length,name' && '' + descriptorKeys != 'name,length'
		return hasInvalidKeys ? true : false
	}

	// own property names should only contain "name" and "length"
	const getOwnPropertyNamesLie = apiFunction => {
		const ownPropertyNames = Object.getOwnPropertyNames(apiFunction)
		const hasInvalidNames = (
			'' + ownPropertyNames != 'length,name' && '' + ownPropertyNames != 'name,length'
		)
		return hasInvalidNames ? true : false
	}

	// own keys names should only contain "name" and "length"
	const getOwnKeysLie = apiFunction => {
		const ownKeys = Reflect.ownKeys(apiFunction)
		const hasInvalidKeys = '' + ownKeys != 'length,name' && '' + ownKeys != 'name,length'
		return hasInvalidKeys ? true : false
	}

	// calling toString() on an object created from the function should throw a TypeError
	const getNewObjectToStringTypeErrorLie = apiFunction => {
		try {
			Object.create(apiFunction).toString()
			return true
		} catch (error) {
			const stackLines = error.stack.split('\n')
			const traceLines = stackLines.slice(1)
			const objectApply = /at Object\.apply/
			const functionToString = /at Function\.toString/
			const validLines = !traceLines.find(line => objectApply.test(line))
			// Stack must be valid
			const validStack = (
				error.constructor.name == 'TypeError' && stackLines.length > 1
			)
			// Chromium must throw error 'at Function.toString' and not 'at Object.apply'
			const isChrome = 3.141592653589793 ** -100 == 1.9275814160560204e-50
			if (validStack && isChrome && (!functionToString.test(stackLines[1]) || !validLines)) {
				return true
			}
			return !validStack
		}
	}

	// arguments or caller should not throw 'incompatible Proxy' TypeError
	const tryIncompatibleProxy = (isFirefox, fn) => {
		try {
			fn()
			return true
		} catch (error) {
			return (
				error.constructor.name != 'TypeError' ||
					(isFirefox && /incompatible\sProxy/.test(error.message)) ? true : false
			)
		}
	}
	const getIncompatibleProxyTypeErrorLie = apiFunction => {
		const isFirefox = getFirefox()
		return (
			tryIncompatibleProxy(isFirefox, () => apiFunction.arguments) ||
			tryIncompatibleProxy(isFirefox, () => apiFunction.arguments)
		)
	}
	const getToStringIncompatibleProxyTypeErrorLie = apiFunction => {
		const isFirefox = getFirefox()
		return (
			tryIncompatibleProxy(isFirefox, () => apiFunction.toString.arguments) ||
			tryIncompatibleProxy(isFirefox, () => apiFunction.toString.caller)
		)
	}

	// setting prototype to itself should not throw 'Uncaught InternalError: too much recursion'
	/*
		Designed for Firefox Proxies
	*/
	const getTooMuchRecursionLie = apiFunction => {
		const isFirefox = getFirefox()
		const nativeProto = Object.getPrototypeOf(apiFunction)
		try {
			Object.setPrototypeOf(apiFunction, apiFunction) + ''
			return true
		} catch (error) {
			return (
				error.constructor.name != 'TypeError' ||
					(isFirefox && /too much recursion/.test(error.message)) ? true : false
			)
		} finally {
			// restore proto
			Object.setPrototypeOf(apiFunction, nativeProto)
		}
	}

	// API Function Test
	const getLies = (apiFunction, proto, obj = null) => {
		if (typeof apiFunction != 'function') {
			return {
				lied: false,
				lieTypes: []
			}
		}
		const name = apiFunction.name.replace(/get\s/, '')
		const lies = {
			// custom lie string names
			[`failed illegal error`]: obj ? getIllegalTypeErrorLie(obj, name) : false,
			[`failed undefined properties`]: obj ? getUndefinedValueLie(obj, name) : false,
			[`failed call interface error`]: getCallInterfaceTypeErrorLie(apiFunction, proto),
			[`failed apply interface error`]: getApplyInterfaceTypeErrorLie(apiFunction, proto),
			[`failed new instance error`]: getNewInstanceTypeErrorLie(apiFunction),
			[`failed class extends error`]: getClassExtendsTypeErrorLie(apiFunction),
			[`failed null conversion error`]: getNullConversionTypeErrorLie(apiFunction),
			[`failed toString`]: getToStringLie(apiFunction, name, globalScope),
			[`failed "prototype" in function`]: getPrototypeInFunctionLie(apiFunction),
			[`failed descriptor`]: getDescriptorLie(apiFunction),
			[`failed own property`]: getOwnPropertyLie(apiFunction),
			[`failed descriptor keys`]: getDescriptorKeysLie(apiFunction),
			[`failed own property names`]: getOwnPropertyNamesLie(apiFunction),
			[`failed own keys names`]: getOwnKeysLie(apiFunction),
			[`failed object toString error`]: getNewObjectToStringTypeErrorLie(apiFunction),
			[`failed at incompatible proxy error`]: getIncompatibleProxyTypeErrorLie(apiFunction),
			[`failed at toString incompatible proxy error`]: getToStringIncompatibleProxyTypeErrorLie(apiFunction),
			[`failed at too much recursion error`]: getTooMuchRecursionLie(apiFunction)
		}
		const lieTypes = Object.keys(lies).filter(key => !!lies[key])
		return {
			lied: lieTypes.length,
			lieTypes
		}
	}

	// Lie Detector
	const createLieDetector = () => {
		const isSupported = obj => typeof obj != 'undefined' && !!obj
		const props = {} // lie list and detail
		let propsSearched = [] // list of properties searched
		return {
			getProps: () => props,
			getPropsSearched: () => propsSearched,
			searchLies: (fn, {
				target = [],
				ignore = []
			} = {}) => {
				let obj
				// check if api is blocked or not supported
				try {
					obj = fn()
					if (!isSupported(obj)) {
						return
					}
				} catch (error) {
					return
				}

				const interfaceObject = !!obj.prototype ? obj.prototype : obj
				Object.getOwnPropertyNames(interfaceObject)
					;[...new Set([
						...Object.getOwnPropertyNames(interfaceObject),
						...Object.keys(interfaceObject) // backup
					])].sort().forEach(name => {
						const skip = (
							name == 'constructor' ||
							(target.length && !new Set(target).has(name)) ||
							(ignore.length && new Set(ignore).has(name))
						)
						if (skip) {
							return
						}
						const objectNameString = /\s(.+)\]/
						const apiName = `${
							obj.name ? obj.name : objectNameString.test(obj) ? objectNameString.exec(obj)[1] : undefined
							}.${name}`
						propsSearched.push(apiName)
						try {
							const proto = obj.prototype ? obj.prototype : obj
							let res // response from getLies

							// search if function
							try {
								const apiFunction = proto[name] // may trigger TypeError
								if (typeof apiFunction == 'function') {
									res = getLies(proto[name], proto)
									if (res.lied) {
										return (props[apiName] = res.lieTypes)
									}
									return
								}
								// since there is no TypeError and the typeof is not a function,
								// handle invalid values and ingnore name, length, and constants
								if (
									name != 'name' &&
									name != 'length' &&
									name[0] !== name[0].toUpperCase()) {
									const lie = [`failed descriptor.value undefined`]
									return (
										props[apiName] = lie
									)
								}
							} catch (error) { }
							// else search getter function
							const getterFunction = Object.getOwnPropertyDescriptor(proto, name).get
							res = getLies(getterFunction, proto, obj) // send the obj for special tests
							if (res.lied) {
								return (props[apiName] = res.lieTypes)
							}
							return
						} catch (error) {
							/*
							const lie = `failed prototype test execution`
							return (
								props[apiName] = [lie]
							)*/
							// allow fail in worker scope (unsupported properties)
							return
						}
					})
			}
		}
	}

	const lieDetector = createLieDetector()
	const {
		searchLies
	} = lieDetector

	// search for lies: remove target to search all properties
	searchLies(() => Intl.DateTimeFormat, {
		target: [
			'formatRange',
			'formatToParts',
			'resolvedOptions'
		]
	})
	searchLies(() => Function, {
		target: [
			'toString',
		],
		ignore: [
			'caller',
			'arguments'
		]
	})
	searchLies(() => WorkerNavigator, {
		target: [
			'appVersion',
			'deviceMemory',
			'hardwareConcurrency',
			'language',
			'languages',
			'platform',
			'userAgent'
		]
	})
	searchLies(() => OffscreenCanvasRenderingContext2D, {
		target: [
			'getImageData',
			'getLineDash',
			'isPointInPath',
			'isPointInStroke',
			'measureText',
			'quadraticCurveTo'
		]
	})
	searchLies(() => OffscreenCanvas, {
		target: [
			'convertToBlob',
			'getContext'
		]
	})
	searchLies(() => Intl.RelativeTimeFormat, {
		target: [
			'resolvedOptions'
		]
	})
	searchLies(() => WebGLRenderingContext, {
		target: [
			'bufferData',
			'getParameter',
			'readPixels'
		]
	})
	searchLies(() => WebGL2RenderingContext, {
		target: [
			'bufferData',
			'getParameter',
			'readPixels'
		]
	})

	// return lies list and detail 
	const props = lieDetector.getProps()
	const propsSearched = lieDetector.getPropsSearched()
	return {
		lieDetector,
		lieList: Object.keys(props).sort(),
		lieDetail: props,
		lieCount: Object.keys(props).reduce((acc, key) => acc + props[key].length, 0),
		propsSearched
	}
}

const getWorkerData = async () => {

	const getAppleFonts = () => [
		'Helvetica Neue'
	]

	const getWindowsFonts = () => [
		'Cambria Math',
		'Lucida Console',
		'MS Serif',
		'Segoe UI'
	]

	const getLinuxFonts = () => [
		'Arimo', // ubuntu, chrome os
		'Cousine', // ubuntu, chrome os
		'MONO', // ubuntu, chrome os (not TB)
		'Jomolhari', // chrome os
		'Ubuntu', // ubuntu (not TB)
		'Chilanka', // ubuntu (not TB)
	]

	const getAndroidFonts = () => [
		'Dancing Script', // android FF
	]

	const getGeneralFonts = () => [
		// Windows
		'Consolas', //FF and Chrome (not TB)
		'HELV', // FF (not TB)
		'Marlett', // chrome
		// Linux 
		'Noto Sans JP', // TB linux
		// Apple
		'Arial Hebrew', // safari + chrome (not FF or TB)
		'Arial Rounded MT Bold', // not TB
		'Geneva', // mac
		'Apple Chancery', // mac (not TB)
		'Apple Color Emoji', // ios, chrome, safari (TB, not FF)
		// Android
		'Roboto', // android FF, Chrome OS
		'Droid Sans Mono', // FF android
		'Cutive Mono', // some android FF
		// Other
		'Liberation Mono', // Chrome OS
		'Noto Sans Yi', // TB on linux and windows, chrome OS, FF android, Safari
		'Monaco', // android + mac
		'Palatino', // android + mac + ios
		'Baskerville', // android + mac
		'Tahoma' // android, mac, windows (not ios, not chrome os 90)
	]

	const getPlatformFonts = () => [
		...getAppleFonts(),
		...getWindowsFonts(),
		...getLinuxFonts(),
		...getAndroidFonts(),
		...getGeneralFonts()
	].sort()

	const getFontFaceSetFonts = list => {
		const controlledErrorMessage = 'FontFaceSet.check blocked or not supported'
		try {
			if (!('fonts' in globalThis)) {
				return []
			}
			const gibberish = '&WY2tR*^ftCiMX9LD5m%iZSWCVSg'
			if (fonts.check(`12px '${gibberish}'`)) {
				throw new Error(controlledErrorMessage)
			} 
			fonts.clear() // clear loaded or added fonts
			const supportedFonts = list.filter(font => fonts.check(`12px '${font}'`))
			return supportedFonts
		} catch (error) {
			if (error.message != controlledErrorMessage) {
				console.error(error)
			}
			return []
		}
	}

	// fontFaceSetFonts and fontSystemClass
	const platformFonts = getPlatformFonts()
	const fontFaceSetFonts = getFontFaceSetFonts(platformFonts)
	const apple = new Set(getAppleFonts())
	const linux = new Set(getLinuxFonts())
	const windows = new Set(getWindowsFonts())
	const android = new Set(getAndroidFonts())
	const fontSystemClass = [...fontFaceSetFonts.reduce((acc, font) => {
		if (!acc.has('Apple') && apple.has(font)) {
			acc.add('Apple')
			return acc
		}
		if (!acc.has('Linux') && linux.has(font)) {
			acc.add('Linux')
			return acc
		}
		if (!acc.has('Windows') && windows.has(font)) {
			acc.add('Windows')
			return acc
		}
		if (!acc.has('Android') && android.has(font)) {
			acc.add('Android')
			return acc
		}
		return acc
	}, new Set())]
	const chromeOnAndroid = (
		''+((fontFaceSetFonts || []).sort()) == 'Baskerville,Monaco,Palatino,Tahoma'
	)
	if (!fontSystemClass.length && chromeOnAndroid) {
		fontSystemClass.push('Android')
	}

	// userAgentData
	const getUserAgentData = async navigator => {
		if (!('userAgentData' in navigator)) {
			return
		}
		const data = await navigator.userAgentData.getHighEntropyValues(
			['platform', 'platformVersion', 'architecture',  'model', 'uaFullVersion']
		)
		const { brands, mobile } = navigator.userAgentData || {}
		const compressedBrands = (brands, captureVersion = false) => brands
			.filter(obj => !/Not/.test(obj.brand)).map(obj => `${obj.brand}${captureVersion ? ` ${obj.version}` : ''}`)
		const removeChromium = brands => (
			brands.length > 1 ? brands.filter(brand => !/Chromium/.test(brand)) : brands
		)
		
		// compress brands
		if (!data.brands) {
			data.brands = brands
		}
		data.brandsVersion = compressedBrands(data.brands, true)
		data.brands = compressedBrands(data.brands)
		data.brandsVersion = removeChromium(data.brandsVersion)
		data.brands = removeChromium(data.brands)
		
		if (!data.mobile) {
			data.mobile = mobile
		}
		const dataSorted = Object.keys(data).sort().reduce((acc, key) => {
			acc[key] = data[key]
			return acc
		},{})
		return dataSorted
	}

	// canvas2d
	let canvasOffscreen2d = undefined
	try {
		canvasOffscreen2d = new OffscreenCanvas(186, 30)
		const context2d = canvasOffscreen2d.getContext('2d')
		canvasOffscreen2d.width  = 186
		canvasOffscreen2d.height = 30
		const str = `😃🙌🧠🦄🐉🌊🍧🏄‍♀️🌠🔮`
		context2d.font = '14px Arial'
		context2d.fillText(str, 0, 20)
		context2d.fillStyle = 'rgba(0, 0, 0, 0)'
		context2d.fillRect(0, 0, 186, 30)
	}
	catch (error) { }
	const getDataURI = async canvasOffscreen2d => {
		if (!canvasOffscreen2d) {
			return
		}
		const blob = await canvasOffscreen2d.convertToBlob()
		const reader = new FileReader()
		reader.readAsDataURL(blob)
		return new Promise(resolve => {
			reader.onloadend = () => resolve(reader.result)
		})
	}
	
	const [
		canvas2d,
		userAgentData
	] = await Promise.all([
		getDataURI(canvasOffscreen2d),
		getUserAgentData(navigator)
	]).catch(error => console.error(error))

	// webglVendor and webglRenderer
	let webglVendor
	let webglRenderer
	try {
		const canvasOffscreenWebgl = new OffscreenCanvas(256, 256)
		const contextWebgl = canvasOffscreenWebgl.getContext('webgl')
		const renererInfo = contextWebgl.getExtension('WEBGL_debug_renderer_info')
		webglVendor = contextWebgl.getParameter(renererInfo.UNMASKED_VENDOR_WEBGL)
		webglRenderer = contextWebgl.getParameter(renererInfo.UNMASKED_RENDERER_WEBGL)
	}
	catch (error) { }

	// timezoneOffset
	const computeTimezoneOffset = () => {
		const date = new Date().getDate()
		const month = new Date().getMonth()
		const year = Date().split` `[3] // current year
		const format = n => (''+n).length == 1 ? `0${n}` : n
		const dateString = `${month+1}/${format(date)}/${year}`
		const dateStringUTC = `${year}-${format(month+1)}-${format(date)}`
		const utc = Date.parse(
			new Date(dateString)
		)
		const now = +new Date(dateStringUTC)
		return +(((utc - now)/60000).toFixed(0))
	}
	const timezoneOffset = computeTimezoneOffset()

	// timeZone
	const timezoneLocation = Intl.DateTimeFormat().resolvedOptions().timeZone

	// navigator
	const { hardwareConcurrency, language, platform, userAgent, deviceMemory } = navigator

	// locale
	const getLocale = () => {
		const constructors = [
			'Collator',
			'DateTimeFormat',
			'DisplayNames',
			'ListFormat',
			'NumberFormat',
			'PluralRules',
			'RelativeTimeFormat'
		]
		const locale = constructors.reduce((acc, name) => {
			try {
				const obj = new Intl[name]
				if (!obj) {
					return acc
				}
				const { locale } = obj.resolvedOptions() || {}
				return [...acc, locale]
			}
			catch (error) {
				return acc
			}
		}, [])

		return [...new Set(locale)]
	}
	const locale = getLocale()

	const lang = (''+language).split(',')[0]
	const localLie = (
		(locale.length && locale.length != 1) || 
		locale[0].toLocaleLowerCase() != lang.toLocaleLowerCase()
	)

	let currencyLanguage
	try {
		currencyLanguage = (1).toLocaleString((lang || undefined), {
			style: 'currency',
			currency: 'USD',
			currencyDisplay: 'name',
			minimumFractionDigits: 0,
			maximumFractionDigits: 0
		})
	} catch (e) {}
	const currencyLocale = (1).toLocaleString(undefined, {
		style: 'currency',
		currency: 'USD',
		currencyDisplay: 'name',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	})

	const languageLie = currencyLocale != currencyLanguage

	// prototype lies
	const {
		lieDetector: lieProps,
		lieList,
		lieDetail,
		lieCount,
		propsSearched
	} = getPrototypeLies(globalThis) // execute and destructure the list and detail
	const prototypeLies = JSON.parse(JSON.stringify(lieDetail))
	const protoLie = lieList.length

	return {
		lied: (
			localLie ||
			languageLie ||
			protoLie
		),
		lies: {
			locale: localLie ? `${''+locale} locale and ${language} language do not match` : false,
			language: languageLie ? `${currencyLocale} locale and ${currencyLanguage} language do not match` : false,
			proto: protoLie ? lieDetail : false
		},
		locale: ''+locale,
		timezoneOffset,
		timezoneLocation,
		deviceMemory,
		hardwareConcurrency,
		language,
		platform,
		userAgent,
		canvas2d,
		webglRenderer,
		webglVendor,
		fontFaceSetFonts,
		fontSystemClass: fontSystemClass.length == 1 ? fontSystemClass[0] : undefined,
		fontListLen: platformFonts.length,
		userAgentData
	}
}

// Tests
const isWorker = !globalThis.document && !!globalThis.WorkerGlobalScope
const isSharedWorker = !!globalThis.SharedWorkerGlobalScope
const isServiceWorker = !!globalThis.ServiceWorkerGlobalScope

// WorkerGlobalScope
const getWorkerGlobalScope = async () => {
	const data = await getWorkerData()
	postMessage(data)
	close()
}

// SharedWorkerGlobalScope
const getSharedWorkerGlobalScope = () => {
	onconnect = async message => {
		const port = message.ports[0]
		const data = await getWorkerData()
		port.postMessage(data)
	}
}

// ServiceWorkerGlobalScope
const getServiceWorkerGlobalScope = () => {
	const broadcast = new BroadcastChannel('creep_service_primary')
	broadcast.onmessage = async event => {
		if (event.data && event.data.type == 'fingerprint') {
			const data = await getWorkerData()
			broadcast.postMessage(data)
		}
	}
}

// WorkerGlobalScope
if (isWorker) {
	isServiceWorker ? getServiceWorkerGlobalScope() :
	isSharedWorker ? getSharedWorkerGlobalScope() :
	getWorkerGlobalScope()
}