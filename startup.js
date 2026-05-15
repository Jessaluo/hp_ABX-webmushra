/*************************************************************************
         (C) Copyright AudioLabs 2017

This source code is protected by copyright law and international treaties. This source code is made available to You subject to the terms and conditions of the Software License for the webMUSHRA.js Software. Said terms and conditions have been made available to You prior to Your download of this source code. By downloading this source code You agree to be bound by the above mentionend terms and conditions, which can also be found here: https://www.audiolabs-erlangen.de/resources/webMUSHRA. Any unauthorised use of this source code may result in severe civil and criminal penalties, and will be prosecuted to the maximum extent possible under law.

**************************************************************************/

function checkOrientation() {//when changing from potrait to landscape change to the rigth width

  var siteWidth = document.body.scrollWidth;
  $("#header").css("width", siteWidth.toString());

}

window.onresize = function(event) {
  if (pageManager.getCurrentPage() && pageManager.getCurrentPage().isMushra == true) {
    pageManager.getCurrentPage().renderCanvas("mushra_items");
  }

  checkOrientation();
};

// $(document).ready(function(){
// $(window).scroll(function(){
// $('#header').css({
// 'left': $(this).scrollLeft()//Note commented because it causes the endless scrolling to the left
// });
// });
// });




// -------------------------------------------------------------------------
// Custom pages for this headphone experiment
// -------------------------------------------------------------------------
function hpHtmlEscape(value) {
  if (value === undefined || value === null) {
    return "";
  }
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


function hpGetParticipantId() {
  var key = "hp_abx_participant_id";
  var existing = window.localStorage ? localStorage.getItem(key) : null;
  if (existing) {
    return existing;
  }
  var randomPart = Math.random().toString(36).substring(2, 10);
  var timePart = Date.now().toString(36);
  var id = "hp_" + timePart + "_" + randomPart;
  if (window.localStorage) {
    localStorage.setItem(key, id);
  }
  return id;
}

function HpFreeResponseAudioPairsPage(_pageManager, _pageTemplateRenderer, _session, _pageConfig) {
  this.pageManager = _pageManager;
  this.pageTemplateRenderer = _pageTemplateRenderer;
  this.session = _session;
  this.pageConfig = _pageConfig;
  this.title = _pageConfig.name || "Free response";
  this.pairs = _pageConfig.pairs || [];
  this.answers = {};
  this.startTime = null;
  this.stored = false;
  if (!window.hpFreeResponseAnswers) {
    window.hpFreeResponseAnswers = {};
  }
}

function hpRememberFreeResponse(name, value) {
  if (!window.hpFreeResponseAnswers) {
    window.hpFreeResponseAnswers = {};
  }
  window.hpFreeResponseAnswers[name] = value || "";
}

function hpStopAllFreeResponseAudio() {
  if (!window.hpFreeResponseAudioPlayers) {
    return;
  }
  Object.keys(window.hpFreeResponseAudioPlayers).forEach(function (key) {
    var player = window.hpFreeResponseAudioPlayers[key];
    if (player) {
      try {
        player.pause();
        player.currentTime = 0;
      } catch (e) {
        console.log("Could not stop free-response audio player", e);
      }
    }
  });
  $(".hp-ab-button").removeClass("ui-btn-active");
}

function hpPlayFreeResponseAudio(playerKey, filePath, buttonId) {
  if (!window.hpFreeResponseAudioPlayers) {
    window.hpFreeResponseAudioPlayers = {};
  }

  hpStopAllFreeResponseAudio();

  var player = window.hpFreeResponseAudioPlayers[playerKey];
  if (!player) {
    player = new Audio(filePath);
    player.preload = "auto";
    window.hpFreeResponseAudioPlayers[playerKey] = player;
  }

  try {
    player.currentTime = 0;
  } catch (e) {
    // Some browsers may not allow currentTime until metadata is loaded.
  }

  if (buttonId) {
    $("#" + buttonId).addClass("ui-btn-active");
  }

  player.onended = function () {
    if (buttonId) {
      $("#" + buttonId).removeClass("ui-btn-active");
    }
  };

  var playPromise = player.play();
  if (playPromise && playPromise.catch) {
    playPromise.catch(function (err) {
      console.log("Could not play free-response audio", err);
    });
  }
}

HpFreeResponseAudioPairsPage.prototype.getName = function () {
  return this.title;
};

HpFreeResponseAudioPairsPage.prototype.render = function (_parent) {
  this.startTime = Date.now();
  _parent.append(this.pageConfig.content || "");

  for (var i = 0; i < this.pairs.length; ++i) {
    var pair = this.pairs[i];
    var name = pair.name || pair.id || ("free_response_" + (i + 1));
    var answer = this.answers[name] || (window.hpFreeResponseAnswers && window.hpFreeResponseAnswers[name]) || "";
    var safeName = hpHtmlEscape(name);
    var pairKey = String(name).replace(/[^a-zA-Z0-9_-]/g, "_");
    var buttonAId = "hp_play_A_" + pairKey;
    var buttonBId = "hp_play_B_" + pairKey;

    var block = $('<div class="hp-free-response-pair" style="margin: 1.2em 0; padding: 1em; border: 1px solid #ddd; border-radius: 8px;"></div>');
    block.append('<h4>' + hpHtmlEscape(pair.title || ("Pair " + (i + 1))) + '</h4>');

    block.append('<p style="margin-bottom: 0.5em;"><strong>Switch between A and B while listening, then describe the difference.</strong></p>');

    var controls = $('<div class="hp-free-response-controls" style="display: flex; gap: 0.75em; flex-wrap: wrap; align-items: center; justify-content: center; text-align: center; margin: 0 auto 0.75em auto;"></div>');
    controls.append('<button type="button" id="' + hpHtmlEscape(buttonAId) + '" class="hp-ab-button ui-btn ui-corner-all ui-btn-inline" onclick="hpPlayFreeResponseAudio(\'' + hpHtmlEscape(pairKey + '_A') + '\', \'' + hpHtmlEscape(pair.aFile || "") + '\', \'' + hpHtmlEscape(buttonAId) + '\')">Play A</button>');
    controls.append('<button type="button" id="' + hpHtmlEscape(buttonBId) + '" class="hp-ab-button ui-btn ui-corner-all ui-btn-inline" onclick="hpPlayFreeResponseAudio(\'' + hpHtmlEscape(pairKey + '_B') + '\', \'' + hpHtmlEscape(pair.bFile || "") + '\', \'' + hpHtmlEscape(buttonBId) + '\')">Play B</button>');
    controls.append('<button type="button" class="ui-btn ui-corner-all ui-btn-inline" onclick="hpStopAllFreeResponseAudio()">Stop</button>');
    block.append(controls);


    block.append('<label for="' + safeName + '"><strong>' + hpHtmlEscape(pair.question || "Describe the difference between A and B.") + '</strong></label>');
    block.append('<textarea id="' + safeName + '" name="' + safeName + '" data-hp-free-response-name="' + safeName + '" rows="5" style="width: 100%; margin-top: 0.5em;" oninput="hpRememberFreeResponse(this.getAttribute(\'data-hp-free-response-name\'), this.value)" onkeyup="hpRememberFreeResponse(this.getAttribute(\'data-hp-free-response-name\'), this.value)" onchange="hpRememberFreeResponse(this.getAttribute(\'data-hp-free-response-name\'), this.value)">' + hpHtmlEscape(answer) + '</textarea>');

    _parent.append(block);
  }
};

HpFreeResponseAudioPairsPage.prototype.save = function () {
  for (var i = 0; i < this.pairs.length; ++i) {
    var pair = this.pairs[i];
    var name = pair.name || pair.id || ("free_response_" + (i + 1));
    var byData = $("textarea[data-hp-free-response-name='" + name + "']");
    var byName = $("textarea[name='" + name + "']");
    if (byData.length > 0) {
      this.answers[name] = byData.val() || "";
    } else if (byName.length > 0) {
      this.answers[name] = byName.val() || "";
    } else if ($("#" + name).length > 0) {
      this.answers[name] = $("#" + name).val() || "";
    } else if (window.hpFreeResponseAnswers && window.hpFreeResponseAnswers[name] !== undefined) {
      this.answers[name] = window.hpFreeResponseAnswers[name] || "";
    } else {
      this.answers[name] = this.answers[name] || "";
    }
  }
};

HpFreeResponseAudioPairsPage.prototype.load = function () {
  var self = this;

  function getTextValue(name) {
    var byData = $("textarea[data-hp-free-response-name='" + name + "']");
    if (byData.length > 0) {
      return byData.val() || "";
    }
    var byName = $("textarea[name='" + name + "']");
    if (byName.length > 0) {
      return byName.val() || "";
    }
    var byId = $("#" + name);
    if (byId.length > 0) {
      return byId.val() || "";
    }
    if (window.hpFreeResponseAnswers && window.hpFreeResponseAnswers[name] !== undefined) {
      return window.hpFreeResponseAnswers[name] || "";
    }
    return "";
  }

  function saveCurrentAnswers() {
    for (var i = 0; i < self.pairs.length; ++i) {
      var pair = self.pairs[i];
      var name = pair.name || pair.id || ("free_response_" + (i + 1));
      self.answers[name] = getTextValue(name);
    }
  }

  function validate() {
    saveCurrentAnswers();
    var complete = true;
    for (var i = 0; i < self.pairs.length; ++i) {
      var pair = self.pairs[i];
      var required = pair.required !== false;
      var name = pair.name || pair.id || ("free_response_" + (i + 1));
      if (required && !($.trim(self.answers[name] || ""))) {
        complete = false;
      }
    }
    if (complete) {
      self.pageTemplateRenderer.unlockNextButton();
    } else {
      self.pageTemplateRenderer.lockNextButton();
    }
  }

  $(document).off("input.hpFreeResponse keyup.hpFreeResponse change.hpFreeResponse blur.hpFreeResponse", "textarea[data-hp-free-response-name]");
  $(document).on("input.hpFreeResponse keyup.hpFreeResponse change.hpFreeResponse blur.hpFreeResponse", "textarea[data-hp-free-response-name]", function () {
    hpRememberFreeResponse($(this).attr("data-hp-free-response-name"), $(this).val());
    validate();
  });
  $("textarea[data-hp-free-response-name]").each(function () {
    hpRememberFreeResponse($(this).attr("data-hp-free-response-name"), $(this).val());
  });
  setTimeout(validate, 25);
  setTimeout(validate, 250);
};

HpFreeResponseAudioPairsPage.prototype.store = function () {
  hpStopAllFreeResponseAudio();
  if (this.stored) {
    return;
  }
  this.save();
  var trial = new Trial();
  trial.id = this.pageConfig.id || "free_response_audio_pairs";
  trial.type = "custom_free_response_audio_pairs";
  trial.responses = [];

  for (var i = 0; i < this.pairs.length; ++i) {
    var pair = this.pairs[i];
    var name = pair.name || pair.id || ("free_response_" + (i + 1));
    trial.responses.push({
      pair_id: pair.id || name,
      question_name: name,
      title: pair.title || ("Pair " + (i + 1)),
      a_label: pair.aLabel || "A",
      a_file: pair.aFile || "",
      b_label: pair.bLabel || "B",
      b_file: pair.bFile || "",
      question: pair.question || "Describe the difference between A and B.",
      answer: (window.hpFreeResponseAnswers && window.hpFreeResponseAnswers[name] !== undefined) ? window.hpFreeResponseAnswers[name] : (this.answers[name] || ""),
      time: this.startTime ? (Date.now() - this.startTime) : null
    });
  }

  this.session.trials.push(trial);
  this.stored = true;
};

function HpDemographicsPage(_pageManager, _pageTemplateRenderer, _session, _pageConfig) {
  this.pageManager = _pageManager;
  this.pageTemplateRenderer = _pageTemplateRenderer;
  this.session = _session;
  this.pageConfig = _pageConfig;
  this.title = _pageConfig.name || "Demographics";
  this.questions = _pageConfig.questions || [];
  this.answers = {};
  this.startTime = null;
  this.stored = false;
}

HpDemographicsPage.prototype.getName = function () {
  return this.title;
};

HpDemographicsPage.prototype.render = function (_parent) {
  this.startTime = Date.now();
  _parent.append(this.pageConfig.content || "");

  var form = $('<div class="hp-demographics-form"></div>');
  for (var i = 0; i < this.questions.length; ++i) {
    var q = this.questions[i];
    var name = q.name || ("demographic_" + (i + 1));
    var saved = this.answers[name] || "";
    var block = $('<div style="margin: 1em 0;"></div>');
    block.append('<p><strong>' + hpHtmlEscape(q.label || name) + '</strong></p>');

    if (q.type === "likert" || q.type === "radio") {
      var responses = q.response || q.options || [];
      for (var j = 0; j < responses.length; ++j) {
        var opt = responses[j];
        var value = opt.value !== undefined ? opt.value : opt;
        var label = opt.label !== undefined ? opt.label : opt;
        var optionId = name + "_" + j;
        var checked = saved === value ? ' checked="checked"' : "";
        block.append('<label for="' + hpHtmlEscape(optionId) + '"><input type="radio" name="' + hpHtmlEscape(name) + '" id="' + hpHtmlEscape(optionId) + '" value="' + hpHtmlEscape(value) + '"' + checked + '> ' + hpHtmlEscape(label) + '</label><br>');
      }
    } else if (q.type === "long_text") {
      block.append('<textarea id="' + hpHtmlEscape(name) + '" name="' + hpHtmlEscape(name) + '" rows="4" style="width: 100%;">' + hpHtmlEscape(saved) + '</textarea>');
    } else {
      block.append('<input type="text" id="' + hpHtmlEscape(name) + '" name="' + hpHtmlEscape(name) + '" value="' + hpHtmlEscape(saved) + '" style="width: 100%;">');
    }
    form.append(block);
  }
  _parent.append(form);
};

HpDemographicsPage.prototype.save = function () {
  for (var i = 0; i < this.questions.length; ++i) {
    var q = this.questions[i];
    var name = q.name || ("demographic_" + (i + 1));
    if (q.type === "likert" || q.type === "radio") {
      this.answers[name] = $("input[name='" + name + "']:checked").val() || "";
    } else {
      this.answers[name] = $("#" + name).val() || "";
    }
  }
};

HpDemographicsPage.prototype.load = function () {
  var self = this;
  function validate() {
    var complete = true;
    for (var i = 0; i < self.questions.length; ++i) {
      var q = self.questions[i];
      var required = q.required !== false;
      var name = q.name || ("demographic_" + (i + 1));
      var value = "";
      if (q.type === "likert" || q.type === "radio") {
        value = $("input[name='" + name + "']:checked").val() || "";
      } else {
        value = $("#" + name).val() || "";
      }
      if (required && !($.trim(value))) {
        complete = false;
      }
    }
    if (complete) {
      self.pageTemplateRenderer.unlockNextButton();
    } else {
      self.pageTemplateRenderer.lockNextButton();
    }
  }
  $("input, textarea").on("input change", validate);
  setTimeout(validate, 25);
};

HpDemographicsPage.prototype.store = function () {
  if (this.stored) {
    return;
  }
  this.save();
  var trial = new Trial();
  trial.id = this.pageConfig.id || "demographics";
  trial.type = "custom_demographics";
  trial.responses = [];

  for (var i = 0; i < this.questions.length; ++i) {
    var q = this.questions[i];
    var name = q.name || ("demographic_" + (i + 1));
    trial.responses.push({
      question_name: name,
      label: q.label || name,
      answer: this.answers[name] || "",
      time: this.startTime ? (Date.now() - this.startTime) : null
    });
  }

  this.session.trials.push(trial);
  this.stored = true;
};

// callbacks
function callbackFilesLoaded() {
  pageManager.start();
  pageTemplateRenderer.renderProgressBar(("page_progressbar"));
  pageTemplateRenderer.renderHeader(("page_header"));
  pageTemplateRenderer.renderNavigation(("page_navigation"));

  if (config.stopOnErrors == false || !errorHandler.errorOccurred()) {
    $.mobile.loading("hide");
    $("body").children().children().removeClass('ui-disabled');
  } else {
    var errors = errorHandler.getErrors();
    var ul = $("<ul style='text-align:left;'></ul>");
    $('#popupErrorsContent').append(ul);
    for (var i = 0; i < errors.length; ++i) {
      ul.append($('<li>' + errors[i] + '</li>'));
    }
    $("#popupErrors").popup("open");
    $.mobile.loading("hide");
  }

  if ($.mobile.activePage) {
    $.mobile.activePage.trigger('create');
  }
}

function callbackURLFound() {
  var errors = errorHandler.getErrors();
  var ul = $("<ul style='text-align:left;'></ul>");
  $('#popupErrorsContent').append(ul);
  for (var i = 0; i < errors.length; ++i) {
    ul.append($('<li>' + errors[i] + '</li>'));
  }
  $("#popupErrors").popup("open");
}

function addPagesToPageManager(_pageManager, _pages) {
  for (var i = 0; i < _pages.length; ++i) {
    if (Array.isArray(_pages[i])) {
      if (_pages[i][0] === "random") {
        _pages[i].shift();
        shuffle(_pages[i]);
      }
      addPagesToPageManager(_pageManager, _pages[i]);
    } else {
      var pageConfig = _pages[i];
      if (pageConfig.type == "generic") {
        _pageManager.addPage(new GenericPage(_pageManager, pageConfig));
      } else if (pageConfig.type == "free_response_audio_pairs") {
        _pageManager.addPage(new HpFreeResponseAudioPairsPage(_pageManager, pageTemplateRenderer, session, pageConfig));
      } else if (pageConfig.type == "demographics") {
        _pageManager.addPage(new HpDemographicsPage(_pageManager, pageTemplateRenderer, session, pageConfig));
      } else if (pageConfig.type == "consent") {
        _pageManager.addPage(new ConsentPage(_pageManager, pageTemplateRenderer, pageConfig));
      } else if (pageConfig.type == "volume") {
        var volumePage = new VolumePage(_pageManager, audioContext, audioFileLoader, pageConfig, config.bufferSize, errorHandler, config.language);
        _pageManager.addPage(volumePage);
      } else if (pageConfig.type == "mushra") {
        var mushraPage = new MushraPage(_pageManager, audioContext, config.bufferSize, audioFileLoader, session, pageConfig, mushraValidator, errorHandler, config.language);
        _pageManager.addPage(mushraPage);
      } else if ( pageConfig.type == "spatial"){
        _pageManager.addPage(new SpatialPage(_pageManager, pageConfig, session, audioContext, config.bufferSize, audioFileLoader, errorHandler, config.language));
      } else if (pageConfig.type == "paired_comparison") {
        var pcPageManager = new PairedComparisonPageManager();
        pcPageManager.createPages(_pageManager, pageTemplateRenderer, pageConfig, audioContext, config.bufferSize, audioFileLoader, session, errorHandler, config.language);
        pcPageManager = null;
      } else if (pageConfig.type == "bs1116") {
        var bs1116PageManager = new BS1116PageManager();
        bs1116PageManager.createPages(_pageManager, pageTemplateRenderer, pageConfig, audioContext, config.bufferSize, audioFileLoader, session, errorHandler, config.language);
        bs1116PageManager = null;
      } else if (pageConfig.type == "likert_single_stimulus") {
        var likertSingleStimulusPageManager = new LikertSingleStimulusPageManager();
        likertSingleStimulusPageManager.createPages(_pageManager, pageTemplateRenderer, pageConfig, audioContext, config.bufferSize, audioFileLoader, session, errorHandler, config.language);
        likertSingleStimulusPageManager = null;
      } else if (pageConfig.type == "likert_multi_stimulus") {
        var likertMultiStimulusPage = new LikertMultiStimulusPage(pageManager, pageTemplateRenderer, pageConfig, audioContext, config.bufferSize, audioFileLoader, session, errorHandler, config.language);
        _pageManager.addPage(likertMultiStimulusPage);
      } else if (pageConfig.type == "finish") {
        var finishPage = new FinishPage(_pageManager, session, dataSender, pageConfig, config.language);
        _pageManager.addPage(finishPage);
      } else {

        errorHandler.sendError("Type not specified.");

      }
    }
  }
}

for (var i = 0; i < $("body").children().length; i++) {
  if ($("body").children().eq(i).attr('id') != "popupErrors" && $("body").children().eq(i).attr('id') != "popupDialog") {
    $("body").children().eq(i).addClass('ui-disabled');
  }
}




function startup(config) {


  if (config == null) {
    errorHandler.sendError("URL couldn't be found!");
    callbackURLFound();
  }

  $.mobile.page.prototype.options.theme = 'a';
  var interval = setInterval(function() {
    $.mobile.loading("show", {
      text : "Loading...",
      textVisible : true,
      theme : "a",
      html : ""
    });
    clearInterval(interval);
  }, 1);
  
  
  if (pageManager !== null) { // clear everything for new experiment
    pageTemplateRenderer.clear();
    $("#page_content").empty();
    $('#header').empty();
  }

  localizer = new Localizer();
  localizer.initializeNLSFragments(nls);

  pageManager = null;
  audioContext;
  audioFileLoader = null;
  mushraValidator = null;
  dataSender = null;
  session = null;
  pageTemplateRenderer = null;
  interval2 = null;

  document.title = config.testname;
  $('#header').append(document.createTextNode(config.testname));

  pageManager = new PageManager("pageManager", "page_content", localizer);
  window.AudioContext = window.AudioContext || window.webkitAudioContext;

  if ( typeof AudioContext !== 'undefined') {
    audioContext = new AudioContext();
  } else if ( typeof webkitAudioContext !== 'undefined') {
    audioContext = new webkitAudioContext();
  }

  document.addEventListener("click", function () {
    if (audioContext.state !== 'running') {
      audioContext.resume();
    }
  }, true);

  try {
    audioContext.destination.channelCountMode = "explicit";
    audioContext.destination.channelInterpretation = "discrete";
    audioContext.destination.channelCount = audioContext.destination.maxChannelCount;
  } catch (e) {
    console.log("webMUSHRA: Could not set channel count of destination node.");
    console.log(e);
  }
  audioContext.volume = 1.0;

  audioFileLoader = new AudioFileLoader(audioContext, errorHandler);
  mushraValidator = new MushraValidator(errorHandler);
  dataSender = new DataSender(config);

  session = new Session();
  session.testId = config.testId;
  session.config = configFile;
  session.participantId = hpGetParticipantId();
  session.participant_id = session.participantId;

  if (config.language == undefined) {
    config.language = 'en';
  }
  pageTemplateRenderer = new PageTemplateRenderer(pageManager, config.showButtonPreviousPage, config.language);
  pageManager.addCallbackPageEventChanged(pageTemplateRenderer.refresh.bind(pageTemplateRenderer));

  addPagesToPageManager(pageManager, config.pages);

  interval2 = setInterval(function() {
    clearInterval(interval2);
    audioFileLoader.startLoading(callbackFilesLoaded);
  }, 10);

}

// start code (loads config) 

function getParameterByName(name) {
  var match = RegExp('[?&]' + name + '=([^&]*)').exec(window.location.search);
  return match && decodeURIComponent(match[1].replace(/\+/g, ' '));
}

var config = null;
var configArg = getParameterByName("config");
var configFile = '';
if (configArg) {
  configFile = 'configs/' + configArg;
} else {
  configFile = 'configs/default.yaml';
}


// global variables
var errorHandler = new ErrorHandler();
var localizer = null;
var pageManager = null;
var audioContext = null;
var audioFileLoader = null;
var mushraValidator = null;
var dataSender = null;
var session = null;
var pageTemplateRenderer = null;
var interval2 = null;


YAML.load(configFile, (function(result) {
  config = result;
  startup(result);
}));
