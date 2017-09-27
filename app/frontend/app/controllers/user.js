import Ember from 'ember';
import session from '../utils/session';
import i18n from '../utils/i18n';

export default Ember.Controller.extend({
  setup: function() {
    this.set('editing', false);
  },
  modeling_levels: function() {
    var res = [
      {name: i18n.t('one_button', "1-button communication"), id: "1"},
      {name: i18n.t('two_three_buttons', "2-3 -button communication"), id: "2"},
      {name: i18n.t('three_plus_buttons', "4+ -button communication"), id: "3"},
    ];
    return res;
  }.property(),
  actions: {
    edit: function() {
      this.set('editing', true);
      this.set('editing_words', false);
      this.set('editing_word_map', false);
    },
    cancel: function() {
      this.get('model').rollbackAttributes();
      this.set('editing', false);
    },
    save: function() {
      var _this = this;
      if(_this.get('editing_words')) {
        _this.set('model.words', _this.get('model.pending_words').split(/\n/));
      }
      if(_this.get('editing_word_map')) {
        var map = {};
        (_this.get('model.pending_word_map') || []).forEach(function(button) {
          button.locale = button.locale || 'en';
          map[button.locale] = map[button.locale] || {}
          map[button.locale][button.label] = button;
        });
        _this.set('model.word_map', {en: map});
      }
      _this.set('status', {saving: true});
      _this.get('model').save().then(function(res) {
        _this.set('status', null);
        _this.set('model.words', null);
        _this.set('model.pending_words', null);
        _this.set('model.pending_word_map', null);
        _this.set('editing', false);
        _this.get('model').load_words(true);
        _this.get('model').load_map();
      }, function(err) {
        _this.set('status', {error: true});
      });
    },
    edit_words: function() {
      this.get('model').set_pending_words();
      this.set('editing_words', true);
    },
    edit_word_map: function() {
      this.get('model').set_pending_word_map();
      this.set('editing_word_map', true);
    },
    cancel_edit_words: function() {
      this.set('editing_words', false);
    },
    cancel_edit_word_map: function() {
      this.set('editing_word_map', false);
    },
    add_button: function() {
      this.set('model.pending_word_map', this.get('model.pending_word_map') || []);
      this.get('model.pending_word_map').pushObject({});
    },
    update_image: function(image, ref) {
      if(ref) {
        Ember.set(ref, 'image', image);
        Ember.set(ref, 'image_url', image.image_url);
      }
    }
  }
});
