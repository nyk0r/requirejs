(function (global, undefined) {
    'use strict';

    var modules = {},
        shims = {},
        nodeRequire = global.require;
    
    function isOfType (obj, type) {
        var objType = /\[\S+\s(\S+)]/.exec(Object.prototype.toString.apply(obj))[1];
        return objType.toUpperCase() === type.toUpperCase();
    }
    
    function getPropertyCaseInsensitive (obj, prop) {
        if (typeof prop === 'undefined') {
            return undefined;
        } 

        prop = prop.toUpperCase();
        for (var key in obj) {
            if (key.toUpperCase() === prop) {
                return obj[key];
            }
        }
        return undefined;
    }

    function getProperty (obj, path) {
        var parts, idx;
        if (!path) return undefined;

        parts = path.split('.');
        for (idx = 0; idx < parts.length; idx++) {
            obj = obj[parts[idx]];
            if ((idx === parts.length - 1)) {
                return obj;
            } else if (!obj) {
                return obj;
            }
        }

        return undefined;
    }

    /**
     * Defines a new module. A defined module can be than required using the 'require' util.
     * @example define('core/loader', function () { return {}; });
     * @example define('utils/dom', ['core/loader'], function (loader) { return {}; });
     * @example define('core/view', ['./loader', 'utils/dom'], function (loader, dom) { return {}; });
     * @param {string} name - Full name of the module.
     * @param {string[]} [deps] - Names of the required module. Names can be absolute or realtive using '.' or '..' at the begging.
     * @param {function} init - A callback returning an initialized module. References to the required modules will be passed as parameters to the callback. If init is an object then it is considered to be an already initialized module.
     */
    function define (name, deps, init) {
        if (arguments.length !== 2 && arguments.length !== 3) {
            throw new Error('Invalid params number');
        } else if (arguments.length === 2) {
            init = deps;
            deps = [];
        }
        
        if (!isOfType(name, 'string') || 
            !isOfType(deps, 'array') || 
            (!isOfType(init, 'function') && !isOfType(init, 'object'))) {
            throw new Error('Invalid params order');
        }
        
        if (typeof getPropertyCaseInsensitive(modules, name) !== 'undefined') {
            throw new Error('Module cannot be defined more than once');
        }

        if (isOfType(init, 'function')) {
            modules[name] = {
                name: name,
                deps: deps,
                init: init
            };
        } else {
            modules[name] = {
                name: name,
                deps: deps,
                obj: init
            };
        }
    }

    function getNameParts (name) {
        return name.split('/').filter(function (e) { return !!e.trim(); });
    }

    function hasModule (name) {
        return !isOfType(getPropertyCaseInsensitive(modules, name), 'undefined');
    }
 
    function globDependencyName (module, dependency) {
        var name;

        if (hasModule(dependency)) {
            return dependency;
        } else {
            module = getNameParts(module);
            dependency = getNameParts(dependency);

            if (dependency[0] === '.') {
                name = module.slice(0, -1).concat(dependency.slice(1, dependency.length));
            } else if (dependency[0] === '..') {
                name = module.slice(0, -2).concat(dependency.slice(1, dependency.length)); 
            } else {
                name = module.slice(0, -1).concat(dependency);       
            }
            name = name.join('/');

            if (hasModule(name)) {
                return name;
            }
        }
        return dependency.join('/');
    }

    function requireModule (name, required) {
        var module, shim, depModules,
            idx, len, dep;

        if (typeof (module = getPropertyCaseInsensitive(modules, name)) !== 'undefined') {
            if (!module.hasOwnProperty('obj')) {
                depModules = [];
                for (idx = 0, len = module.deps.length; idx < len; idx++) {
                    dep = globDependencyName(name, module.deps[idx]);
                    depModules.push(requireModule(dep));
                }
                module.obj = module.init.apply(global, depModules);
            }
            return module.obj;
        } else if (typeof (shim = getPropertyCaseInsensitive(shims, name)) !== 'undefined') {
            return getProperty(global, shim.exports);
        } else if (isOfType(name, 'string') && required) {
            throw new Error('Cannot find module ' + name);
        } else {
            return undefined;
        }
    }

    /**
     * Requires a defined modules by its fullname.
     * @example require('core/view');
     * @example require(['core/view', 'utils/dom'], function (view, dom) { view.render(); });
     * @param {string[]|string} deps - Required modules or a single module.
     * @param {function} [callback] - A callback to be called with the initialized required modules as params.
     * @returns {object|undefined} If there is only one required module and a callback is not specified returns the required module, else returns undefined.
     */
    function require (deps, callback) {
        if (nodeRequire && isOfType(deps, 'string')) {
            try {
                return nodeRequire(deps);
            } catch (e) {
                if (e.code !== 'MODULE_NOT_FOUND') {
                    throw new Error('Cannot find module ' + deps);
                }
            }
        }

        var idx, len,
            depModules = [];

        deps = isOfType(deps, 'array') ? deps : [deps];
        for (idx = 0, len = deps.length; idx < len; idx++) {
            depModules.push(requireModule(deps[idx]));
        }
        if (callback) {
            callback.apply(global, depModules);
        } else {
            return depModules.length === 1 ? depModules[0] : depModules;
        }

        return undefined;
    }

    /**
     * Configures require by RequireJS conventions.
     * @params {object} cfg - config. 
     */
    require.config = function (cfg) {
        /*
            shim: {
                jQuery: { exports: 'jQuery' },
                underscore: { exports: '_' },
                'underscore.string': { exports: '_.str' }
            }
        */

        if (!isOfType(cfg, 'object') || cfg.shim && !isOfType(cfg.shim, 'object')) {
            throw new Error('Invalid config');
        }
        shims = cfg.shim || shims || {};
    };

    Object.defineProperty(require, 'hasNativeRequire', {        
       enumerable: true,
       configurable: false,
       get: function () {
           return !!nodeRequire;
       }
    });

    // export global functions
    global.define = define;
    global.require = require;
})(window);