var data_url = 'https://raw.githubusercontent.com/Wruczek/FakeCommentsHider/master/data/profilesAndWords.txt';
var checkforupdates_url = 'https://raw.githubusercontent.com/Wruczek/FakeCommentsHider/master/data/version.txt';
var banned_profiles;
var banned_words;
var original_channels;
var removed = 1;
var version = 0.4;

var onReportClick = function(e) {
		var profileId = $(this).data("profileId"),
			comment = $(this).data("comment"),
			url = document.location.href,
			commenturl = url + "&lc=" + $(this).data("commenturl"),
			username = $(this).data("username");
		
		// Znak nowej linii
		var nl = "%0A";
		
		var title = "Zgłoszenie podszywającego się profilu";
		var body = "Chcę zgłosić podszywający się profil \"" + encodeURIComponent(username) + "\"" + nl + nl + 
				"Informacje:" + nl + 
				"ID profilu: " + profileId + nl + 
				"Pozostawiony komentarz: " + encodeURIComponent(comment) + nl + 
				"URL strony: " + encodeURIComponent(url) + nl +
				"URL komentarza: " + encodeURIComponent(commenturl);
		
		window.open("https://github.com/Wruczek/FakeCommentsHider/issues/new?title=" + encodeURIComponent(title) + "&body=" + body,'_blank');
		
		$(this).prop('disabled', true).html('<span style="font-color: red;">ZGŁOSIŁEŚ TEN PROFIL. DZIĘKUJĘ.</span>').addClass('hide-fedora-reported');
};

var execute = function() {
	
	$(".comment-item").each(function(index, element) {
		var el = $(element),
			profileId = el.attr('data-aid'),
			comment = el.find('.comment-text-content').first().text().trim(),
			commenturl = el.attr('data-cid'),
			username = el.attr('data-name').replace("í", "i").replace("Í", "i"),
			thisEl = $(this);
		
		if(checkProfile(profileId, username, comment, thisEl) || checkComment(comment)) {
			
			console.log(profileId + ": " + comment);
			
			if(thisEl.hasClass('reply')) {
				thisEl.remove();
			} else {
				thisEl.closest('.comment-entry').remove();
			}
			
			console.log("Removed: " + removed++);
			$("#FakeCommentsHiderStats").html(removed);
		} else if(!thisEl.hasClass("hide-fedora-tagged")) {
			thisEl.addClass("hide-fedora-tagged");
			
			thisEl.find('.footer-button-bar')
				.first()
				.after('<button type="button" class="hide-fedora-report-btn">ZGŁOŚ PODSZYWAJĄCY SIĘ PROFIL</button>');

			thisEl.find('.hide-fedora-report-btn')
				.data('profileId', profileId)
				.data('comment', comment)
				.data('commenturl', commenturl)
				.data('username', username)
				.click(onReportClick);
		}
	});
};

$(function() {
	
	$.getJSON(data_url, function(res) {
		banned_profiles = res.profiles;
		banned_words = res.words;
		original_channels = res.originalChannels;
	});
	
	// Wsparcie dla nowego YT (ładowanie strony przez AJAX bez przeładowywanie jej)
	var interval = setInterval(function() {
		scan();
		//clearInterval(interval);
	}, 1000);
	
	scan();
	
	checkForUpdates();
});

var checkComment = function(comment) {
	if(comment == null)
		return false;
	
	for (i = 0; i < banned_words.length; i++) {
		if(comment.includes(banned_words[i])) {
			console.log("Niedozwolony string " + banned_words[i] + " w: " + comment);
			return true;
		}
	}
	return false;
}

var checkProfile = function(profileId, username, comment, element) {
	if(profileId == null || username == null)
		return false;
	
	if(banned_profiles.contains(profileId))
		return true;
	
	if(element.hasClass("channel-owner"))
		return false;
	
	var channelLink = element.find('a').first().attr("href").split("/")[2];
	
	for (i = 0; i < original_channels.length; i++) {
		var JSONprofileName = original_channels[i][0];
		var JSONprofileId = original_channels[i][1];
		if(username.toUpperCase().includes(JSONprofileName.toUpperCase())) {
			console.log(username + " == " + JSONprofileName + ", zbanowano " + profileId + ", " + comment);
			return JSONprofileId != channelLink;
		}
	}
	return false;
}

var scan = function() {
	
	var target = document.querySelector('#watch-discussion');
		
	// Statystyki
	if(document.getElementById("FakeCommentsHiderStats") == null) {
		$("<div style=\"background-color: yellow;\"><center>Usunięto <span id=\"FakeCommentsHiderStats\">0</span> nieprawdziwych komentarzy.</br><span style=\"font-size: 90%;\">W miare poruszania się po komentarzach i czytaniu odpowiedzi liczba będzie się zwiększać.</span></br></br><span style=\"font-size: 85%;\">Podoba Ci się ta wtyczka? Możesz wesprzeć mnie poprzez <a href=\"https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=9PL5J7ULZQYJQ\" target=\"_blank\">PayPala</a> lub <a href=\"https://steamcommunity.com/tradeoffer/new/?partner=126623086&token=V3eGov0E\" target=\"_blank\">wysyłając mi jakieś skiny</a>. Za wszystkie dotacje bardzo dziękuje! :)</span></center></div></br>").insertBefore("#watch-discussion");
	}
	
	if(target !== null) {
		
		// Set MutationObserver
		var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
		var observer = new MutationObserver(function() {
			execute();
		});
		 
		var config = { childList: true, subtree: true };
		 
		observer.observe(target, config);
		
		// Execute removal a couple of times before MutationObserver kicks in
		var counter = 0;
		var interval = setInterval(function() {
			execute();
			
			counter++;
			if(counter === 10) {
				clearInterval(interval);
			}
		}, 250);
	}
}

var checkForUpdates = function() {
	$.ajax({url: checkforupdates_url, 
		success: function(data) {
			if(data != version) {
				alert("FakeCommentsHider jest nieaktualny. Proszę rozważyć aktualizację wtyczki.");
				window.open("https://github.com/Wruczek/FakeCommentsHider",'_blank');
			}
		}
	});
}

// Metody wspomagajace

Array.prototype.contains = function(obj) {
    var i = this.length;
    while (i--) {
        if (this[i] === obj) {
            return true;
        }
    }
    return false;
}
