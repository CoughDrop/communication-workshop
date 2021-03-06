import Ember from 'ember';
import modal from '../utils/modal';
import Component from '@ember/component';
import $ from 'jquery';

export default Component.extend({
  didInsertElement: function() {
    this.stretch();
    if(!this.get('already_opened')) {
      this.set('already_opened', true);
      this.sendAction('opening');
    }
    var _this = this;
    var resize = function() {
      _this.stretch();
    };
    window.addEventListener('resize', resize);
    this.set('resize', resize);
  },
  willDestroyElement: function() {
    window.removeEventListener('resize', this.get('resize'));
    this.set('resize', null);
  },
  stretch: function() {
    if(this.get('stretch_ratio')) {
      var height = $(window).height() - 50;
      var width = $(window).width();
      var modal_width = (width * 0.9);
      if(modal_width > height * this.get('stretch_ratio') * 0.9) {
        modal_width = height * this.get('stretch_ratio') * 0.9;
      }
      $(this.get('element')).find(".modal-dialog").css('width', modal_width);
    } else if(this.get('full_stretch')) {
      var height = $(window).height() - 50;
      var width = $(window).width();
      var modal_width = (width * 0.97);
      $(this.get('element')).find(".modal-dialog").css('width', modal_width);
    } else if(this.get('desired_width')) {
      var width = $(window).width();
      var modal_width = (width * 0.9);
      if(this.get('desired_width') < modal_width) {
        modal_width = this.get('desired_width');
      }
      $(this.get('element')).find(".modal-dialog").css('width', modal_width);
    } else {
      $(this.get('element')).find(".modal-dialog").css('width', '');
    }
    var height = $(window).height() - 50;
    $(this.get('element')).find(".modal-content").css('maxHeight', height).css('overflow', 'auto');
  }.observes('stretch_ratio', 'desired_width'),
  willDestroy: function() {
    if(!this.get('already_closed')) {
      this.set('already_closed', true);
      this.sendAction('closing');
    }
  },
  touchStart: function(event) {
    this.send('close', event);
  },
  mouseDown: function(event) {
    this.send('close', event);
  },
  actions: {
    close: function(event) {
      if(!$(event.target).hasClass('modal')) {
        return;
      } else {
        event.preventDefault();
        return this.sendAction();
      }
    }
  }
});


window.addEventListener('message', function(event) {
  if(event.data == 'close-modal') {
    modal.close();
  }
});
