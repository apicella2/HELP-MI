



/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////


function inizio(){
	for (g in gruppi){
		document.getElementById(g).checked = false;
		var a = selectedGruppo.indexOf(g); 
		selectedGruppo.splice(a,1); // rimuove da array 
	}
}

function inizio2(){
check_if_firefox();
// 2. posizione
document.getElementById('menu_log').innerHTML = 'Imposto la posizione...';
individua_posizione(); // ha già dentro calcola_distanza

}

// INIZIALIZE
function initialize() {
//alert('initialize');
	geocoder = new google.maps.Geocoder();
	directionsDisplay = new google.maps.DirectionsRenderer();
	//var center = new google.maps.LatLng(45.464217,9.190491);
	var mapOptions = {
		center: markerHere.position,
		zoom: 15,
		minZoom: 10,
		mapTypeId: google.maps.MapTypeId.ROADMAP,
		mapTypeControl: false,
		panControl: false,
		zoomControl: true,
		zoomControlOptions: {
							style: google.maps.ZoomControlStyle.DEFAULT,
							position: google.maps.ControlPosition.RIGHT_CENTER
							},
		scaleControl: false,
		streetViewControl: false
	};
	
	map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);
	markerHere.setMap(map);
	
/*		  
	infowindow = new google.maps.InfoWindow({
		content: 'ohiohi',
		maxWidth: 200
	});
*/
	
	//AUTOCOMPLETE START
	var input = /** @type {HTMLInputElement} */(document.getElementById('address'));
	var autocomplete = new google.maps.places.Autocomplete(input);
	//autocomplete.bindTo('bounds', map);
	//AUTOCOMPLETE END

	//  autocomplete per ricerca
	var input2 = /** @type {HTMLInputElement} */(document.getElementById('altro'));
	var autocomplete = new google.maps.places.Autocomplete(input2);

	
	travelmode = google.maps.DirectionsTravelMode.DRIVING;


	// Create a <script> tag and set the USGS URL as the source.
	var script = document.createElement('script');
	// (In this example we use a locally stored copy instead.)
	 //script.src = 'http://earthquake.usgs.gov/earthquakes/feed/geojsonp/2.5/week';
	script.src = 'data/data.js';
	document.getElementsByTagName('head')[0].appendChild(script);
	
	directionsDisplay.setMap(map);
	directionsDisplay.setPanel(document.getElementById('percorso'));	

	//inizio2();
	individua_posizione(); // ha già dentro calcola_distanza
	wait_for_distances += 1;
	}
// FINE INITIALIZE

function codeAddress() {
	document.getElementById("posizione").style.display = 'none';
	var address = document.getElementById('address').value;

  //alert(address);
	geocoder.geocode( { 'address': address}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
		document.getElementById('menu_log').style.display = 'none';
		document.getElementById('menu_standard').style.display = 'block';
		posHere = results[0].geometry.location;
		markerHere.setPosition(posHere);
		wait_for_distances += 1;
		map.setCenter(posHere);
		calcola_distanza();
		if(destinazione_scelta){
			calcola_percorso();
		}
		clearOverlays();
		showOverlays();
		//aggiorna_posizione();
		// aggiustare: se c'era percorso, ricalcolare, ecc
		//showOverlays();
    } else {
		//alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}

function calcola_percorso() {
	nascondi_div();
	var start = posHere;
	var end = destination;
	var request = {
		origin:start,
		destination:end,
		travelMode: travelmode// google.maps.DirectionsTravelMode.DRIVING
	};
	directionsService.route(request, function(response, status) {
		if (status == google.maps.DirectionsStatus.OK) {
		destinazione_scelta = true;
		document.getElementById('menu_percorso').style.display = 'inline';
		directionsDisplay.setDirections(response);
		} else { alert('noooo'); }
	});
}


function aggiorna_posizione() {
	document.getElementById('menu_log').style.display = 'none';
	document.getElementById('menu_standard').style.display = 'block';
	
	markerHere.setPosition(posHere);
	map.setCenter(posHere);
	//circle.setPosition(posHere);
	//circle.setMap(map);	
	calcola_distanza();
	if(destinazione_scelta){
		calcola_percorso();
	}
	clearOverlays();
	showOverlays();
}

function individua_posizione() {
//document.getElementById("info").style.display = 'none';
  // Try HTML5 geolocation 
  if(navigator.geolocation) {
	navigator.geolocation.getCurrentPosition(geolocation,errorGettingPosition,{timeout:10000});
  //alert('geolocation');
  } else {
    // Browser doesn't support Geolocation
		alert('Error: Your browser doesn\'t support geolocation.');
		document.getElementById("posizione").style = "display:block";
		//document.getElementById("pos_manuale").value = "on";
		//wait_for_distances = true;
  }
	//mostra_gruppi(); 
}

function geolocation(position){
	document.getElementById('menu_log').style.display = 'block';
	document.getElementById('menu_standard').style.display = 'none';
	document.getElementById('menu_log').innerHTML = 'Imposto la posizione...';
	//alert('position');
	posHere = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
	//alert('posizione aggiornata');
	markerHere.setPosition(posHere);
	wait_for_distances += 1;	
	markerHere.setMap(map);
	map.setCenter(posHere);	
	//circle.setPosition(posHere);
	//circle.setMap(map);
	
	//mostra_gruppi();
	document.getElementById('menu_log').style.display = 'none';
	document.getElementById('menu_standard').style.display = 'block';
	document.getElementById('posizione').style.display = 'none';
	calcola_distanza();
	if (destinazione_scelta){
		calcola_percorso();
		}
	clearOverlays();
	showOverlays();	
}

function errorGettingPosition(err){
alert('Rilevamento automatico della posizione non funzionante');
	document.getElementById('menu_log').innerHTML = 'Imposta la posizione manualmente';
	mostra_posizione();
}

function drag_marker(){
	document.getElementById('menu_log').style.display = 'block';
	document.getElementById('menu_standard').style.display = 'none';
	document.getElementById('menu_log').innerHTML = 'Muovi manualmante la posizione sulla mappa <input onclick="drag_marker_stop()" type="button" value="FINITO">';
	document.getElementById("posizione").style.display = 'none';
	//document.getElementById("map-canvas").style.display = 'block';
	markerHere.setDraggable(true);
	//posHere = new google.maps.LatLng(45.464217,9.190491);
	//markerHer.setPosition(posHere);
	//map.setCenter(posHere);
}

function drag_marker_stop(){
	document.getElementById('menu_log').style.display = 'none';
	document.getElementById('menu_standard').style.display = 'block';
	markerHere.setDraggable(false);
	posHere = markerHere.position;
	map.setCenter(posHere);
	wait_for_distances += 1;
	calcola_distanza();
	if(destinazione_scelta){
		calcola_percorso();
	}
	clearOverlays();
	showOverlays();
}



function cerca_altro(){
	document.getElementById("gruppi").style.display = 'none';
	var address = document.getElementById('altro').value;
  //alert(address);
	geocoder.geocode( { 'address': address}, function(results, status) {
		if (status == google.maps.GeocoderStatus.OK) {
		//alert('ok');
			for (var i = 0; i < results.length; i++) {
				var marker = new google.maps.Marker({
				  position: results[i].geometry.location,
				  map: null,
				  content: 'altro',
				  title: address,
				  distanza: '',
				  dettagli: {'INFO': results[i].formatted_address}
				});
				google.maps.event.addListener(marker, 'click', function() { info(this);});
				markersArray.push(marker);
				calcola_distanza();
			}
			selectedGruppo.push('altro')
			showOverlays();
    } else {
		//alert('Geocode was not successful for the following reason: ' + status);
    }
  });
}

// Removes the overlays from the map, but keeps them in the array
function clearOverlays() {
	if (markersArray) {
		for (i in markersArray) {
			markersArray[i].setMap(null);
			destinazione_scelta = false;
		}
	}
}

// Shows any overlays currently in the array
function showOverlays() {
//alert(distances_ok);
	if (selectedGruppo.length>0){
		for (g in selectedGruppo){
			if (markersArray.length>0) {
				if(distances_ok){
					for (i in markersArray) {
						if(markersArray[i].content == selectedGruppo[g]){
							//alert(markersArray[i].distanza);
							if(markersArray[i].distanza <= DistanzaImpostata) {
								markersArray[i].setIcon(ico_image[gruppi[selectedGruppo[g]]]['yes']);
								} else {
								markersArray[i].setIcon(ico_image[gruppi[selectedGruppo[g]]]['no']);
								}
							markersArray[i].setMap(map);
						}
					}
				} else {
					calcola_distanza()
					showOverlays()
				}
			}
		}
		//document.getElementById('info').style.display = 'none';
	}
}




function mostra(id){
var infotext = '<div id="draggable"><p align="right"><input type="button" value="x" onclick="nascondi_div()"></p></div>';
	var DivObj = document.getElementById('info');
/*	if(DivObj.style.display == "block"){
		DivObj.style.display = "none";
	} else {
	*/
		DivObj.innerHTML = infotext + document.getElementById(id).innerHTML;
		DivObj.style.display = 'block';
	//}
}














function make_a_call(){
// Telephony object
var tel = navigator.mozTelephony;

// Check if the phone is muted (read/write property)
console.log(tel.muted);

// Check if the speaker is enabled (read/write property)
console.log(tel.speakerEnabled);

// Place a call
var call = tel.dial("0236580497");
}

