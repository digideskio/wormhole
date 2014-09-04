define(["emitter"], function (emitter) {
	var store,
		_storage,
		_storageNS = '__wormhole.store__:',
		_storageData = {},

		_parseJSON = JSON.parse,
		_stringifyJSON = JSON.stringify
	;


	function _storageKey(key) {
		return _storageNS + key;
	}


	function _isStoreKey(key) {
		return key.indexOf(_storageNS) === 0;
	}


	function _getCleanedKey(key) {
		return key.substr(_storageNS.length);
	}


	/**
	 * Получить рабочий storage по названию
	 * @param   {String}  name
	 * @returns {sessionStorage}
	 * @private
	 */
	function _getStorage(name) {
		try {
			var storage = window[name + 'Storage'];

			storage.setItem(_storageNS, _storageNS);

			/* istanbul ignore else */
			if (storage.getItem(_storageNS) == _storageNS) {
				storage.removeItem(_storageNS);
				return storage;
			}
		} catch (err) { }
	}


	//  Пробуем получить sessionStorage, либо localStorage
	_storage = _getStorage('session') || /* istanbul ignore next */ _getStorage('local');


	store = emitter.apply({
		/**
		 * Установить значение
		 * @param {String} key
		 * @param {*}      value
		 */
		set: function (key, value) {
			_storageData[key] = value;
			_storage && _storage.setItem(_storageKey(key), _stringifyJSON(value));
		},


		/**
		 * Получить значение
		 * @param   {String}  key
		 * @returns {*}
		 */
		get: function (key) {
			return _storageData[key];
		},


		/**
		 * Удалить значение
		 * @param  {String} key
		 */
		remove: function (key) {
			delete _storageData[key];
			_storage && _storage.removeItem(_storageKey(key));
		}
	});


	/**
	 * Обработчик обновления хранилища
	 * @param evt
	 * @private
	 */
	function _onsync(evt) {
		var fullKey = evt.key,
			key = _getCleanedKey(fullKey),
			newValue,
			oldValue;

		if (key && _isStoreKey(fullKey)) {
			newValue = _storage.getItem(fullKey);
			oldValue = _stringifyJSON(_storageData[key]);

			/* istanbul ignore else */
			if (newValue !== oldValue) {
				_storageData[key] = (newValue = _parseJSON(newValue));

				store.emit('change', _storageData);
				store.emit('change:' + key, newValue);
			}
		}
	}


	// Получаем текущее состояние
	_storage && (function () {
		var i = _storage.length,
			key;

		/* istanbul ignore next */
		while (i--) {
			key = _storage.key(i);

			if (_isStoreKey(key)) {
				_storageData[_getCleanedKey(key)] = _parseJSON(_storage.getItem(key));
			}
		}

		/* istanbul ignore else */
		if (window.addEventListener) {
			window.addEventListener('storage', _onsync, false);
		} else {
			window.attachEvent('onstorage', _onsync);
		}
	})();


	// Export
	return store;
});