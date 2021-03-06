require 'json_api/word'
require 'typhoeus'

class Api::WordsController < ApplicationController
  def index
    words = WordData.where(:has_content => true, :locale => (params['locale'] || 'en'))
    if params['q']
      words = words.where(:word => params['q'].downcase)
    elsif params['sort'] == 'recommended' 
      if @api_user
        words = @api_user.related_words
      else
        words = User.recommended_words
      end
    elsif params['sort'] == 'alpha'
      words = words.order('word')
    elsif params['sort'] == 'missing'
      words = words.where(has_baseline_content: false).order('random_id').limit(100).to_a.sort_by{|w| rand }
    else
      cutoff = rand(9999999999)
      words = words.order("CASE WHEN random_id > #{cutoff} THEN random_id ELSE random_id + 9999999999 END").limit(50).to_a.sort_by{|w| rand }
    end
    render json: JsonApi::Word.paginate(params, words)
  end
  
  def generate_packet
    user_ids = []
    user_ids << @api_user.global_id if @api_user
    word_ids = (params['word_ids'] || '').split(/::/)
    progress = Progress.schedule(PacketMaker, :generate_download, {:words => word_ids, :user_ids => user_ids})
    render json: JsonApi::Progress.as_json(progress, :wrapper => true)
  end
  
  def show
    word = WordData.find_or_initialize_by_path(params['id'])
    return unless exists?(word, params['id'])
    return unless allowed?(word, 'view')
    render json: JsonApi::Word.as_json(word, wrapper: true, permissions: @api_user)
  end
  
  def update
    word = WordData.find_or_initialize_by_path(params['id'])
    return unless exists?(word, params['id'])
    return unless allowed?(word, 'revise')
    if word.process(params['word'], {'user' => @api_user})
      render json: JsonApi::Word.as_json(word, wrapper: true, permissions: @api_user)
    else
      api_error(400, {error: 'error saving word settings'})
    end
  end
  
  def defaults
    if !@api_user
      return allows?(WordData.new, 'no_permission')
    end
    url = "https://app.mycoughdrop.com/api/v1/buttonsets/1_398"
    json = Rails.cache.fetch('default_word_settings', :expires_in => 6.hours) do
      res = Typhoeus.get(url)
      res.body
    end
    hash = JSON.parse(json)
    button = hash['buttonset']['buttons'].detect{|b| b['label'] == params['id']}
    if button
      res = Typhoeus.get("https://app.mycoughdrop.com/api/v1/search/parts_of_speech?q=#{params['id']}&suggestions=true&access_token=#{ENV['COUGHDROP_TOKEN']}")
      pos = JSON.parse(res.body) rescue nil
      res = Typhoeus.get("http://relatedwords.org/api/related?term=#{params['id']}")
      related = JSON.parse(res.body) rescue []
      
      render json: {
        background_color: button['background_color'],
        border_color: button['border_color'],
        parts_of_speech: pos && pos['types'] && pos['types'].join(', '),
        image_url: button['image'],
        sentences: pos && pos['sentences'] && pos['sentences'].select{|s| s['approved'] }.map{|s| s['sentence'] },
        pairs: ((pos && pos['recent_usage'] && pos['recent_usage']['pairs']) || []).map{|p| p['partner'] }.compact.select{|w| w != params['id'] },
        related: related[0, 50].map{|w| w['word'] }
      }
    else
      render api_error(404, {error: 'no button found'})
    end
  end
  
  def add
    add_or_remove_word(params, :add)
  end

  def remove
    add_or_remove_word(params, :remove)
  end
  
  def star_activity
    star_or_unstar_activity(params, :star)
  end
  
  def unstar_activity
    star_or_unstar_activity(params, :unstar)
  end
  
  def suggestions
    return unless exists?(@api_user, 'user_required')
    hash = WordData.suggestions_for(@api_user, false, params['id'])
    render json: hash
  end

  def destroy
    word = WordData.find_by_path(params['id'])
    return unless exists?(word, params['id'])
    return unless allowed?(word 'delete')
    word.destroy
    render json: JsonApi::Word.as_json(word, wrapper: true, permissions: @api_user)
  end
  
  def perform_activity
    activity_id = params['id'] || ''
    word_id = activity_id.split(/:/)[0]
    word = WordData.find_by_path(word_id)
    return unless exists?(word, word_id)
    return unless allowed?(word, 'view')
    res = @api_user.track_activity(word, activity_id, params['details'])
    if res
      render json: res
    else
      api_error 400, {error: 'activity tracking failed'}
    end
  end
  
  protected
  
  def add_or_remove_word(params, action)
    word = WordData.find_or_initialize_by_path(params['id'])
    return unless exists?(@api_user, 'user_required')
    return unless exists?(word, params['id'])
    return unless allowed?(word, 'view')
    if action == :add
      @api_user.add_word(word, params)
      render json: {added: true}
    elsif action == :remove
      @api_user.remove_word(word, params)
      render json: {removed: true}
    end
  end
  
  def star_or_unstar_activity(params, action)
    word = WordData.find_by_path(params['id'])
    return unless exists?(@api_user, 'user_required')
    return unless exists?(word, params['id'])
    return unless allowed?(word, 'view')
    activity = word.find_activity(params['activity_id'])
    return unless exists?(activity, params['activity_id'])
    res = @api_user.star_activity(word, activity, action)
    if !res[:success]
      return api_error(400, {error: 'starring action failed'})
    end
    render json: {starred: res[:starred]}
  end
end
