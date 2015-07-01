//# The Databinder

// based on https://github.com/james2doyle/bind (gone)
// this can be used to extend a backbone view, so that changes
// in the model used by the view are immediately reflected in the dom
// aka (two-way) databinding
// ## Dependencies
// [`dom`](https://github.com/bobbor/nwt),
// [`underscore`](http://underscorejs.org/)
// ## usage
// #### HTML
// ```html
// <div class="foo" data-bb-target="=bar">baz</div>
// ```
// #### JS
// ```javascript
// var view = new View({el: '.foo'});
// view.model.set({'bar': 'someval'});
// ```
// #### result in HTML
// ```html
// <div class="foo" data-bb-target="=bar">someval</div>
// ```
// so simply setting a value on the model causes the corresponding dom to update,
// which removes unnecessary code in the view, that does nothing more than simply setting
// a class or an attribute
//
// _note_: inputs are not yet available
/*jshint browser:true */
/*globals define */
(function(root, factory) {
    if(window.define !== undefined && define.amd) {
        define(['dom', 'underscore'], function() {
            return factory.apply(root, arguments);
        });
    } else {
        window.binder = factory(window.DOM, window._);
    }
}(this, function($, _) {
    'use strict';

    var slice = Array.prototype.slice;
    var trim = function(str) {
        return str.replace(/^\s*|\s*$/g, '');
    };

    return function(name) {
        var view = this;
        var model = view.model;
        var ctx = view.el;
        var targets = [];
        var inputs = [];
        var il;
        var tl;

        // the constructor collects all inputs and targets with the specified name
        // it also creates the listeners to update the targets
        var Binder = function() {
            newInput(name);
            newTarget(name);
            createListeners();
        };

        function rakeInputs(_name, sel) {
            // this collects all elements matching `sel` on the context
            var els = slice.call(ctx.querySelectorAll(sel));
            // only add it to the `inputs` if the el has the correct attribute
            if (ctx.hasAttribute('data-bb-source')) {
                els.push(ctx);
            }
            // uniqify the inputs, so we have no doubled elements.
            inputs = _.uniq(inputs.concat(els));
            il = inputs.length;
            return els;
        }
        
        function newInput(_name) {
            return rakeInputs(_name, '[data-bb-source="' + _name + '"]');
        }

        function rakeTargets(_name, sel) {
            // this collects all elements matching `sel` on the context
            var els = slice.call(ctx.querySelectorAll(sel));
            // only add them to the collection if they match the conditions
            if (ctx.hasAttribute('data-bb-target') &&
                (new RegExp(_name + '$', 'g')).test(ctx.getAttribute('data-bb-target'))) {
                els.push(ctx);
            }
            // unigify the targets, so we have no double setting
            targets = _.uniq(targets.concat(els));
            tl = targets.length;
            return els;
        }

        function newTarget(_name) {
            return rakeTargets(_name, '[data-bb-target$="' + _name + '"]');
        }

        // change a specific element according to its own definition
        function change(el) {
            var $el = $.one(el);
            var attr = $el.data('bb-target');
            var char = attr.charAt(0);

            switch (char) {
                // `^` changes a `data-`-Attribute
                case '^':
                    return function(val, _name) {
                        $el.data(_name, val);
                    };
                // `=` changes the text-value of the element
                case '=':
                    return function(val) {
                        $el.text(val);
                    };
                // `.` changes the class
                case '.':
                    return function(val, _name) {
                        var prefix = _name + '-';
                        var cn = prefix + val;
                        var classNames = el.className.split(' ');
                        classNames.forEach(function(className) {
                            if (!trim(className).indexOf(prefix)) {
                                $el.removeClass(className);
                            }
                        });
                        $el.addClass(cn);
                    };
            }
        }

        // when the named property changes of the model, then
        // the elements/targets change accordingly
        function createListeners(els, _name) {
            els = els || targets;
            _name = _name || name;
            _.forEach(els, function(el) {
                model.on('change:' + _name, function(model, value) {
                    change(el)(value, _name);
                });
                change(el)(model.get(_name), _name);
            });
        }

        // constructing the prototype
        Binder.prototype = {
            inputs     : inputs,
            targets    : targets,
            destroy    : function() {
                model.off('change');
            },
            addTargets : function(name) {
                createListeners(newTarget(name), name);
            },
            addInputs  : function(name) {
                /*createBinding(newInput(nname));*/
            }
        };

        return new Binder();
    };
}))
