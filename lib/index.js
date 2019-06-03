'use strict';

/**
 * Module dependencies.
 */

var Identify = require('segmentio-facade').Identify;
var integration = require('@astronomerio/analytics.js-integration');
var useHttps = require('use-https');

/**
 * Expose `LuckyOrange` integration.
 */

var LuckyOrange = module.exports = integration('Lucky Orange')
  .assumesPageview()
  .global('_loq')
  .global('__lo_cs_added')
  .global('__wtw_lucky_site_id')
  .global('__wtw_custom_user_data')
  .option('siteId', null)
  .option('events', [])
  .tag('http', '<script src="http://www.luckyorange.com/w.js?{{ cacheBuster }}">')
  .tag('https', '<script src="https://ssl.luckyorange.com/w.js?{{ cacheBuster }}">');

/**
 * Initialize.
 *
 * @api public
 */

LuckyOrange.prototype.initialize = function() {
  if (!window._loq) window._loq = [];
  window.__wtw_lucky_site_id = this.options.siteId;

  var user = this.analytics.user();
  this.identify(new Identify({
    traits: user.traits(),
    userId: user.id()
  }));

  var cacheBuster = Math.floor(new Date().getTime() / 60000);
  var tagName = useHttps() ? 'https' : 'http';
  this.load(tagName, { cacheBuster: cacheBuster }, this.ready);
};

/**
 * Loaded?
 *
 * @api private
 * @return {boolean}
 */

LuckyOrange.prototype.loaded = function() {
  return !!window.__lo_cs_added;
};

/**
 * Identify.
 *
 * @param {Identify} identify
 */

LuckyOrange.prototype.identify = function(identify) {
  var traits = identify.traits();
  var email = identify.email();
  if (email) traits.email = email;
  var name = identify.name();
  if (name) traits.name = name;
  window.__wtw_custom_user_data = traits;
};

/**
 * Track.
 *
 * @api public
 * @param {Track} track
 */

LuckyOrange.prototype.track = function(track) {
  // Find LuckyOrange tag details from setting's event map
  // otherwise abort
  var loEvent = aliasEvent(track.event(), this.options.events);
  if (!loEvent) return;

  window._loq.push(['tag', loEvent.tag || track.event(), loEvent.star || false, loEvent.overwrite || false]);
};

/**
 * Alias a regular event `name` to a Lucky Orange event settings, using a dictionary of
 * `events`.
 *
 * @api private
 * @param {string} name
 * @param {Object} options
 * @return {string|null}
 */

function aliasEvent(name, mapping) {
  var key = name.toLowerCase();

  if (mapping) {
    for (var k in mapping) {
      if (mapping[k].eventName && key === mapping[k].eventName.toLowerCase()) {
        return mapping[k];
      }
    }
  }

  return false;
}
