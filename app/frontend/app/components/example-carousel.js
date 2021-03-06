import Ember from 'ember';
import i18n from '../utils/i18n';
import session from '../utils/session';
import modal from '../utils/modal';
import Component from '@ember/component';
import { htmlSafe } from '@ember/template';
import { get as emberGet, set as emberSet } from '@ember/object';

export default Component.extend({
  didInsertElement: function() {
    var _this = this;
    var handler = function() {
      var e = _this.get('element');
      var fs = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
      _this.set('fullscreen', e === fs);
    };
    this.set('handler', handler);
    this.set('session', session);
    document.addEventListener('fullscreenchange', handler);
    document.addEventListener('webkitfullscreenchange', handler);
    document.addEventListener('onmozfullscreenchange', handler);
    document.MSFullscreenChange = handler;
  },
  willDestroyElement: function() {
    var handler = this.get('handler');
    document.removeEventListener('fullscreenchange', handler);
    document.removeEventListener('webkitfullscreenchange', handler);
    document.removeEventListener('onmozfullscreenchange', handler);
  },
  pinned: function() {
    var ids = this.get('session.user.starred_activity_ids');
    return !!(ids && this.get('current_entry.id') && ids.indexOf(this.get('current_entry.id')) !== -1);
  }.property('session.user.starred_activity_ids', 'current_entry.id'),
  session: function() {
    return session;
  }.property(),
  tall: function() {
    return !this.get('fullscreen') && !this.get('update_revision_object');
  }.property('update_revision_object', 'fullscreen'),
  clear_on_change: function() {
    this.set('current_index', 0);
  }.observes('entries', 'type'),
  current_entry: function() {
    var index = this.get('current_index') || 0;
    return (this.get('entries') || [])[index];
  }.property('entries', 'entries.length', 'current_index'),
  entry_class: function() {
    if(this.get('book_type')) {
      return htmlSafe('glyphicon glyphicon-book');
    } else if(this.get('video_type')) {
      return htmlSafe('glyphicon glyphicon-play-circle');
    } else if(this.get('prompt_type')) {
      return htmlSafe('glyphicon glyphicon-question-sign');
    } else if(this.get('type') == 'activity_ideas' || this.get('current_entry.type') == 'activity_ideas') {
      return htmlSafe('glyphicon glyphicon-tower');
    } else if(this.get('type') === 'learning_projects' || this.get('current_entry.type') === 'learning_projects') {
      return htmlSafe('glyphicon glyphicon-briefcase');
    } else if(this.get('type') === 'modeling' || this.get('current_entry.type') === 'modeling') {
      return htmlSafe('glyphicon glyphicon-hand-up');
    } else if(this.get('type') === 'topic_starters' || this.get('current_entry.type') === 'topic_starters') {
      return htmlSafe('glyphicon glyphicon-comment');
    } else if(this.get('type') === 'send_homes' || this.get('current_entry.type') === 'send_homes') {
      return htmlSafe('glyphicon glyphicon-apple');
    }
  }.property('current_entry', 'current_entry.type', 'type'),
  current_entry_classes: function() {
    var res = {};
    for(var idx = 1; idx <= 4; idx++) {
      var klass = 'btn btn-default face_button';
      if(this.get('current_entry.perform_details.success_level') == idx) {
        klass = 'btn btn-primary face_button';
      }
      res['level_' + idx + '_class'] = htmlSafe(klass);
    }
    return res;
  }.property('current_entry.perform_details.success_level'),
  readable_index: function() {
    return (this.get('current_index') || 0) + 1;
  }.property('current_index'),
  prompt_type: function() {
    return this.get('type') === 'prompts' || this.get('current_entry.type') == 'prompts';
  }.property('type', 'current_entry.type'),
  description: function() {
    return this.get('type') === 'learning_projects' || this.get('type') == 'activity_ideas' || this.get('type') == 'send_homes' ||
            this.get('current_entry.type') == 'learning_projects' || this.get('current_entry.type') == 'activity_ideas' || this.get('current_entry.type') == 'send_homes';
  }.property('type', 'current_entry.type'),
  include_url: function() {
    var url_type = this.get('type') === 'learning_projects' || this.get('type') == 'activity_ideas' || this.get('type') === 'books' || this.get('type') == 'videos' ||
            this.get('current_entry.type') === 'learning_projects' || this.get('current_entry.type') == 'activity_ideas' || this.get('current_entry.type') === 'books' || this.get('current_entry.type') == 'videos' ||
            this.get('type') == 'send_homes' || this.get('current_entry.type') == 'send_homes';
    return url_type && this.get('current_entry.url');
  }.property('type', 'current_entry.type', 'current_entry.url'),
  book_type: function() {
    return this.get('type') == 'books' || this.get('current_entry.type') == 'books';
  }.property('current_entry.type', 'type'),
  video_type: function() {
    return this.get('type') == 'videos' || this.get('current_entry.type') == 'videos';
  }.property('current_entry.type', 'type'),
  include_sentence: function() {
    return this.get('type') === 'modeling' || this.get('current_entry.type') == 'modeling';
  }.property('type', 'current_entry.type'),
  related_words: function() {
    return this.get('type') === 'topic_starters' || this.get('current_entry.type') == 'topic_starters';
  }.property('type', 'current_entry.type'),
  actions: {
    next: function() {
      var idx = this.get('current_index') || 0;
      this.set('current_entry.perform_details', null);
      this.set('current_index', Math.min(idx + 1, (this.get('entries') || []).length - 1));
    },
    previous: function() {
      var idx = this.get('current_index') || 0;
      this.set('current_entry.perform_details', null);
      this.set('current_index', Math.max(idx - 1, 0));
    },
    confirm_revision: function() {
      this.sendAction('update_revision_object', this.get('current_entry'), this.get('revision_attribute'));
    },
    pin: function(action, activity) {
      if(activity.id) {
        this.sendAction('pin', activity.id, action);
      }
    },
    save_perform_details: function(activity, details) {
      var _this = this;
      var activity_id = emberGet(activity, 'id');
      details = details || emberGet(activity, 'perform_details');
      _this.set('save_status', {saving: true});
      session.ajax('/api/v1/activities/' + activity_id + '/perform', {
        type: 'POST',
        data: {
          details: details
        }
      }).then(function(res) {
        _this.set('save_status', null);
        if(res.activity_id == activity_id && emberGet(activity, 'perform_details')) {
          emberSet(activity, 'perform_details', res);
        }
      }, function(err) {
        _this.set('save_status', {error: true});
      });
    },
    perform: function(activity) {
      // ajax call, change UI to prompt for more details
      var _this = this;
      emberSet(activity, 'performed', true);
      var d = (new Date());
      emberSet(activity, 'perform_details', {
//         date: (d.getFullYear()) + "-" + ("00" + (d.getMonth() + 1)).slice(-2) + "-" + ("00" + d.getDate()).slice(-2),
//         time: ("00" + d.getHours()).slice(-2) + ":" + ("00" + d.getMinutes()).slice(-2)
      });
      _this.set('save_status', null);
      this.send('save_perform_details', activity);
    },
    unperform: function(activity) {
      emberSet(activity, 'performed', false);
      emberSet(activity, 'perform_details', null);
      this.send('save_perform_details', activity, {remove: true});
    },
    close_perform_details: function(activity) {
      this.send('save_perform_details', activity);
      emberSet(activity, 'perform_details', null);
    },
    set_success_level: function(activity, level) {
      emberSet(activity, 'perform_details.success_level', level);
    },
    skip: function(activity) {
      emberSet(activity, 'skipped', true);
      // ajax call, then hit next
      this.send('next');
    },
    launch_book: function() {
      if(this.get('fullscreen')) {
        this.send('full_screen');
      }
      modal.open('book-reader', {book: this.get('current_entry')});
    },
    launch_video: function() {
      if(this.get('fullscreen')) {
        this.send('full_screen');
      }
      modal.open('video-player', {video: this.get('current_entry')});
    },
    full_screen: function() {
      var e = this.get('element') || {};
      if(this.get('fullscreen')) {
        if(document.exitFullscreen) {
          document.exitFullscreen();
        } else if(document.webkitExitFullscreen) {
          document.webkitExitFullscreen();
        } else if(document.mozCancelFullScreen) {
          document.mozCancelFullScreen();
        } else if(document.msExitFullscreen) {
          document.msExitFullscreen();
        }
        this.set('fullscreen', false);
      } else {
        var fs = e.requestFullscreen || e.webkitRequestFullscreen || e.mozRequestFullScreen || e.msRequestFullscreen;
        if(e) {
          if(e.requestFullscreen) {
            e.requestFullscreen();
          } else if(e.webkitRequestFullscreen) {
            e.webkitRequestFullscreen();
          } else if(e.mozRequestFullScreen) {
            e.mozRequestFullScreen();
          } else if(e.msRequestFullscreen) {
            e.msRequestFullscreen();
          }
          this.set('fullscreen', true);
        }
      }
    }
  }
});
