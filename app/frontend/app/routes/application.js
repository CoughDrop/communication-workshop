import Ember from 'ember';
import modal from '../utils/modal';
import session from '../utils/session';

export default Ember.Route.extend({
  setupController: function(controller, model) {
    modal.setup(this);
  }
});