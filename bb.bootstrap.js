//# Bridge

// Automagically construct the correct JS-Objects based on the HTML
// ## Dependencies
// [`backbone`](http://backbonejs.org/),
// [`underscore`](http://underscorejs.org/),
// [`dom`](https://github.com/bobbor/dom),
// [`binder`](binder.html)
/*jshint browser:true */
/*globals define */
(function(root, factory) {
    if(define !== undefined && define.amd) {
        define(['backbone', 'underscore', 'dom', 'binder'], function() {
           return factory.apply(root, arguments);
        });
    } else {
        window.BB = factory(window.Backbone, window._, window.DOM, window.binder);
        window.DOM.ready(function() {
            BB.bootstrap(document);
        });
    }
}(this, function(Backbone, _, $, binder) {
    'use strict';
    var definedViews = {};
    var definedModels = {
        'default' : Backbone.Model
    };
    var numRE = /^(\-?[0-9]+|\-?[0-9]*(\.[0-9]+)+)$/;
    // parseVal tries to convert the val from markup to a simple data-type<br/>
    // supported are
    // * `undefined`
    // * `null`
    // * `true`
    // * `false`
    // * `numbers`
    // * `strings`
    // arrays and objects are not supported
    function parseVal(str) {
        if (!str || str === 'undefined') {
            return;
        }
        if (str === 'null') {
            return null;
        }
        if (str === 'true') {
            return true;
        }
        if (str === 'false') {
            return false;
        }
        if (numRE.test(str)) {
            return parseFloat(str);
        }
        return str;
    }
    // parse a string into an object
    // ##### input:
    // `"a:b;c:d;e:f"`
    // ##### output:
    // `{a:"b", c:"d", e:"f"}`
    function getAttrs(propString) {
        var props = propString.split(';');
        return _.reduce(props, function(propMap, prop) {
            var keyval = prop.split(':');
            var k = keyval[0];
            var v = parseVal(keyval[1]);

            propMap[k] = v;
            return propMap;
        }, {});
    }
    // finds all targets in the specified context (`element`)
    // and on the element itself
    function getTargets(element) {
        var ret = [];
        var targets = element.all('[data-bb-target]');
        targets.forEach(function(target) {
            var val = target.data('bb-target');
            ret.push(val.substring(1, val.length));
        });
        if (element.data('bb-target')) {
            var val = element.data('bb-target');
            ret.push(val.substring(1, val.length));
        }
        return _.uniq(ret);
    }
    //
    return {
        // this is the initial logic to be called on an element to bootstrap
        // this looks for all `[data-bb-view]`-elements in the context and inits them
        bootstrap     : function(el) {
            $.all('[data-bb-view]', el).forEach(function(dec) {
                var name;
                var definition;
                var attrs = {};
                var model;
                var _View;
                if (dec.prop('_view')) {
                    return;
                }

                // get the name of the view, and check if it has been registered
                name = dec.data('bb-view');
                definition = definedViews[name];
                if (!definition) {
                    window.console.warn('View "' + name + '" not registered');
                    return;
                }

                // is there a model-attribute, and if yes prefill the model for the view
                if (dec.hasAttr('data-bb-model')) {
                    _.extend(attrs, getAttrs(dec.data('bb-model')));
                }
                model = new definition.Model(attrs);

                // are there model-targets inside the view, and if so, bind it.
                var targets = getTargets(dec);

                // create a "proxy-view" for the defined one, which does data-binding on construction
                if(binder) {
                    _View = definedViews[name].View.extend({
                        initialize: function () {
                            // we do binding here
                            this.name = name;
                            _.map(targets, function (target) {
                                return binder.call(this, target);
                            }, this);
                            return definedViews[name].View.prototype.initialize.apply(this, arguments);
                        }
                    });
                } else {
                    _View = definedViews[name].View;
                }
                //
                /*jshint -W031*/
                new _View({
                    el    : dec._node,
                    model : model
                });
                /*jshint +W031 */
                // specify on the element, that the view has been initialized
                dec.prop('_view', true);
            });
        },
        // the method in 99.9% of the time to use.
        // this registers a view under the specified name.
        // a model can tell which model to use - if any
        registerView  : function(name, model, definition) {
            if (typeof model === 'function') {
                definition = model;
                model = 'default';
            }
            definedViews[name] = {
                Model : definedModels[model],
                View  : definition
            };
        },
        // this method registers a specific model which then can be used in a view.
        // it is really not that necessary a regular model in backbone can be extended with properties at runtime
        // only do that if you need a model with specific functions that are not already in the default model
        registerModel : function(name, definition) {
            definedModels[name] = definition;
        }
    };
}));
