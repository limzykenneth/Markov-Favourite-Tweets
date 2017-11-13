$(document).ready(function() {
	$("#form #max-tweets").val(100);
	$("#form #max-tweets-value").text(100);
	$("#form #max-generate").val(5);
	$("#form #max-generate-value").text(5);

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
			}).then(function(sentences){
				var generatedDisplay = "";
				_.each(sentences, function(el, i){
					generatedDisplay += "<p>";
					generatedDisplay += el;
					generatedDisplay += "</p>";
				});

				$("#result").html(generatedDisplay);
			});
		}
	});

	$("#form #max-tweets").on("input", function(e){
		$("#form #max-tweets-value").text($(this).val());
	});

	$("#form #max-generate").on("input", function(e){
		$("#form #max-generate-value").text($(this).val());
	});
});