/* jshint devel:true */
/* global describe, beforeEach, afterEach, it, chai, sinon, $, kendo, define, require */
/* jshint -W030 */

describe('Require and define mechanism', function () {
    'use strict';

    var expect = chai.expect;

    it('can define and undefine an arbitrary object', function () {
        var hash = {
            str: 'str',
            obj: {},
            arr: [],
            num: 1
        }, path;

        // define
        for (path in hash) {
            if (hash.hasOwnProperty(path)) {
                define(path, hash[path]);
            }
        }

        // check
        for (path in hash) {
            if (hash.hasOwnProperty(path)) {
                expect(require(path)).to.equal(hash[path]);
            }
        }

        // undefine
        for (path in hash) {
            if (hash.hasOwnProperty(path)) {
                require.undefine(path);
            }
        }

        // check again
        for (path in hash) {
            if (hash.hasOwnProperty(path)) {
                expect(require(path)).to.be.undefined;
            }
        }
    });

    it('prohibits attepts to define somthing more than once', function () {
        define('obj', {});
        expect(function () { define('obj', {}); }).to.throw('Module cannot be defined more than once');
        require.undefine('obj');
    });

    it('can define a factory', function () {
        define('factory', function () {
            return 'product';
        });

        expect(require('factory')).to.equal('product');

        require.undefine('factory');
    });

    describe('can define a factory', function () {
        it('which is called only once on first require and returns a singletone', function () {
            var singletone,
                factory = sinon.spy(function () {
                    return {};
                });

            define('factory', factory);
            expect(factory.called).to.be.false;
            singletone = require('factory');
            expect(require('factory')).to.equal(singletone);
            expect(factory.calledOnce).to.be.true;

            require.undefine('factory');
        });

        it('which can have dependencies', function () {
            define('dep1', 'dep1');
            define('dep2', 'dep2');

            define('factory', ['dep1', 'dep2'], function () {
            });
            require('factory');

            require.undefine('dep1');
            require.undefine('dep2');
            require.undefine('factory')
        });

        it('which can have dependencies with relative paths', function () {
            var factory = sinon.spy();

            define('tests/sub1/sub2/dep1', 'tests/sub1/sub2/dep1');
            define('tests/dep2', 'tests/dep2');
            define('tests/sub1/dep3', 'tests/sub1/dep3');
            define('tests/sub1/sub2/sub3/dep4', 'tests/sub1/sub2/sub3/dep4');
            define('tests/sub2/dep5', 'tests/sub2/dep5')

            define(
                'tests/sub1/sub2/factory',
                [
                    './dep1',
                    '../../dep2',
                    '../dep3',
                    './sub3/dep4',
                    '../../sub2/dep5'
                ],
                factory
            );
            require('tests/sub1/sub2/factory');

            expect(factory.alwaysCalledWithExactly(
                'tests/sub1/sub2/dep1',
                'tests/dep2',
                'tests/sub1/dep3',
                'tests/sub1/sub2/sub3/dep4',
                'tests/sub2/dep5'
            )).to.be.true;

            require.undefine('tests/sub1/sub2/dep1');
            require.undefine('tests/dep2');
            require.undefine('tests/sub1/dep3');
            require.undefine('tests/sub1/sub2/sub3/dep4');
            require.undefine('tests/sub2/dep5');
        });
    });
});
