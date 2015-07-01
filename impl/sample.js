BB.registerView('sample', Backbone.View.extend({
    events: {
        'click span': 'onSpanClick'
    },
    initialize: function() {
        this.model.set('foo', 'bar');
    },
    onSpanClick: function() {
        this.model.set('foo', 'what?')
    }
}));
