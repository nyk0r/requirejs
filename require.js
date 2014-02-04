/*  browser:true, jshint eqeqeq:true, curly:true, forin:true, indent:4, nonew:false, quotmark:single, strict:true */

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

    global.define = function (name, deps, init) {
        if (arguments.length !== 2 && arguments.length !== 3) {
            throw new Error('Invalid params number');
        } else if (arguments.length === 2) {
            init = deps;
            deps = [];
        }
        
        if (!isOfType(name, 'string') || !isOfType(deps, 'array') || !isOfType(init, 'function')) {
            throw new Error('Invalid params order');
        }
        
        if (typeof getPropertyCaseInsensitive(modules, name) !== 'undefined') {
            throw new Error('Module cannot be defined more than once');
        }

        modules[name] = {
            name: name,
            deps: deps,
            init: init
        };
    };

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
            throw Error('Cannon find module ' + name);
        } else {
            return undefined;
        }
    }

    global.require = function (deps, callback) {
        if (nodeRequire && isOfType(deps, 'string')) {
            try {
                return nodeRequire(deps);
            } catch (e) {
                if (e.code !== 'MODULE_NOT_FOUND') {
                    throw Error('Cannon find module ' + deps);
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
    };

    global.require.config = function (cfg) {
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

    Object.defineProperty(global.require, 'hasNativeRequire', {        
       enumerable: true,
       configurable: false,
       get: function () {
           return !!nodeRequire;
       }
    });
})(window);