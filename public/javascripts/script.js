$(document).ready(function() {
	$("#form #max-tweets").val(100);
	$("#form #max-tweets-value").text(100);
	$("#form #max-generate").val(5);
	$("#form #max-generate-value").text(5);

	// Form submission
	$("#form").submit(function(e){
		e.preventDefault();

		if($("#twitter-handle").val().length !== 0){
			var body = {
				handle: $("#twitter-handle").val(),
				sampleSize: $("#form #max-tweets").val(),
				returnSize: $("#form #max-generate").val()
			};

			fetch("/", {
				method: "post",
				body: JSON.stringify(body),
				headers: new Headers({
					"Content-Type": "application/json"
				})
			}).then(function(response){
				return response.json();
			}).then(renderTweets);
		}
	});

	$("#form #max-tweets").on("input", function(e){
		$("#form #max-tweets-value").text($(this).val());
	});

	$("#form #max-generate").on("input", function(e){
		$("#form #max-generate-value").text($(this).val());
	});

	// Collapsible
	$(".collapsible").before(function(){
		var icon;
		if($(this).attr("x-collapsible-status") == "collapsed"){
			icon = '<i class="fa fa-caret-right" aria-hidden="true"></i>';
		}else if($(this).attr("x-collapsible-status") == "expanded"){
			icon = '<i class="fa fa-caret-down" aria-hidden="true"></i>';
		}
		return `<span class="collapsible-title" x-collapsible-target="${$(this).attr("id")}"><span class="collapsible-icon">${icon}</span> ${$(this).attr("x-collapsible-title")}</span>`;
	});

	$(".collapsible-title").click(function(e) {
		var $target = $(`#${$(this).attr("x-collapsible-target")}`);
		var collapsedIcon = '<i class="fa fa-caret-right" aria-hidden="true"></i>';
		var expandedIcon = '<i class="fa fa-caret-down" aria-hidden="true"></i>';


		if($target.attr("x-collapsible-status") == "collapsed"){
			$target.attr("x-collapsible-status", "expanded");
			$(this).find(".collapsible-icon").html(expandedIcon);

			$target.css("display", "block");
		}else if($target.attr("x-collapsible-status") == "expanded"){
			$target.attr("x-collapsible-status", "collapsed");
			$(this).find(".collapsible-icon").html(collapsedIcon);

			$target.css("display", "none");
		}
	});

	// Tweet generated tweet
	$("#page-content #tweets .tweet #tweet-this").click(function(e) {

	});
});

function renderTweets(sentences){
	var tpl = _.template($("#tweets-template").html());

	$("#tweets").html(tpl({sentences: sentences}));
}