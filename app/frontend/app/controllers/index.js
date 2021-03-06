import Ember from 'ember';
import modal from '../utils/modal';
import Controller from '@ember/controller';

export default Controller.extend({
  load_words: function(force) {
    var _this = this;
    if(_this.get('words.length') && force === false) { return; }
    _this.set('words', {loading: true});
    this.store.query('word', {sort: 'recommended'}).then(function(res) {
      _this.set('words', res.slice(0, 5));
    }, function() {
      _this.set('words', {error: true});
    });
  },
  load_categories: function(force) {
    var _this = this;
    if(_this.get('categories.length') && force === false) { return; }
    _this.set('categories', {loading: true});
    this.store.query('category', {sort: 'recommended'}).then(function(res) {
      _this.set('categories', res.slice(0, 5));
    }, function() {
      _this.set('categories', {error: true});
    });
  },
  load_report: function() {
    var _this = this;
      _this.set('events', {loading: true});
    _this.store.query('event', {sort: 'recent'}).then(function(res) {
      _this.set('events', res);
    }, function() {
      _this.set('events', {error: true});
    });
  },
  load_missing_words: function(force) {
    var _this = this;
    if(_this.get('missing_words.length') && force === false) { return; }
    _this.set('missing_words', {loading: true});
    _this.store.query('word', {sort: 'missing'}).then(function(res) {
      _this.set('missing_words', res.slice(0, 3));
    }, function() {
      _this.set('missing_words', {error: true});
    });
  },
  actions: {
    suggestions: function(type) {
      var _this = this;
      modal.open('focus-suggestions', {type: type}).then(function() {
        _this.load_report();
      });
    }
  }
});

