var map;
var markerHere_layer;
var drag;
var servizi_layer, markerSelected;
var size, offset, icon;
var posHere;
var markerHere;
var percorso_layer, from, to;


function init() {
	var lon = 9.190491;
	var lat = 45.464217;
	var zoom = 17;
	posHere = new OpenLayers.LonLat(lon, lat).transform("EPSG:4326", "EPSG:900913");
	
    map = new OpenLayers.Map({
        div: "map",
		layers: [new OpenLayers.Layer.OSM('basemap_layer')],
        projection: new OpenLayers.Projection("EPSG:900913"),
		displayProjection: new OpenLayers.Projection("EPSG:4326"),
		center: posHere,
		zoom: zoom
    });
    
// geolocation
	markerHere_layer = new OpenLayers.Layer.Markers('markerHere_layer');//,{projection: new OpenLayers.Projection("EPSG:4326")});
	map.addLayer(markerHere_layer);
	
	size = new OpenLayers.Size(21,25);
	offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
	icon = new OpenLayers.Icon('http://www.openlayers.org/dev/img/marker.png', size, offset);
	markerHere = new OpenLayers.Marker(posHere,icon);
	markerHere_layer.addMarker(markerHere);
	
	
	drag = new OpenLayers.Control.DragFeature(markerHere_layer);
	map.addControl(drag);
	
// servizi
	carica_servizi();

	//var geojson_format = new OpenLayers.Format.GeoJSON();
	//servizi_layer.addFeatures(geojson_format.read(data));
	//alert(servizi_layer.features.length);
	
	//localizzami();
	//carica_dati();

// percorsi
	percorso_layer = new OpenLayers.Layer.Vector("percorso_layer");
	map.addLayer(percorso_layer);

}

function carica_servizi(){
	var style = new OpenLayers.StyleMap();/*{
		'default': OpenLayers.Util.applyDefaults(
			{label: "${l}", pointRadius: 10},
			OpenLayers.Feature.Vector.style["default"]
		),
		'select': OpenLayers.Util.applyDefaults(
			{pointRadius: 10},
			OpenLayers.Feature.Vector.style.select
		),
		//externalGraphic: '../img/marker.png', // icona da gruppo
		graphicWidth: 20,
		graphicHeight: 24,
		graphicYOffset: -24,
		title: ''	
	});*/
	
	var layerListeners = {
		featureclick: function(e) {
			//alert(e.feature.data); //e.object.name + " says: " + e.feature.id + " clicked.");
			//var f = e.feature;
			markerSelected = e.feature.geometry.getCentroid();
			alert(markerSelected.x + ', ' + markerSelected.y);
			//alert(e.feature.id);
			//var position = servizi_layer.events.getMousePosition(e.feature);
			//map.setCenter(position);
			//var position = e.feature.geometry.getCentroid().x;
			//alert(position);
			return false;
		}/*,
		nofeatureclick: function(e) {
			alert(e.object.name + " says: No feature clicked.");
		}*/
	};
	
	servizi_layer = new OpenLayers.Layer.Vector("servizi_layer", {
			projection: map.displayProjection,
            strategies: [new OpenLayers.Strategy.Fixed()],
            protocol: new OpenLayers.Protocol.HTTP({
                url: "dati.json",
                format: new OpenLayers.Format.GeoJSON()
            }),
			styleMap: style,
			eventListeners: layerListeners
        });
	map.addLayer(servizi_layer);
	





/*    var features = new Array(25); // per ogni gruppo selezionato
    for (var i=0; i<features.length; i++) {
        features[i] = data_gruppo();
    }

	// create the layer styleMap that uses the above style for all render intents
	
	var geojson_format = new OpenLayers.Format.GeoJSON();
	servizi_layer.addFeatures(geojson_format.read(data);
	
    var vector = new OpenLayers.Layer.Vector({
		styleMap: style,
		eventListeners: layerListeners
	});
    vector.addFeatures(features);
	map.addLayer(vector);
	
	var sf = new OpenLayers.Control.SelectFeature(vector_layer);
	sf.activate();*/
}

function data_gruppo(){
	var geojson_format = new OpenLayers.Format.GeoJSON();
	//vector_layer.addFeatures(geojson_format.read(data);


/*
geojson_layer = new OpenLayers.Layer.Vector("GeoJSON", {
            strategies: [new OpenLayers.Strategy.Fixed()],
            protocol: new OpenLayers.Protocol.HTTP({
                url: "ml/lines.json",
                format: new OpenLayers.Format.GeoJSON()
            })
        });
*/

    /**
     * Here we create a new style object with rules that determine
     * which symbolizer will be used to render each feature.
     */
    var style = new OpenLayers.Style(
        // the first argument is a base symbolizer
        // all other symbolizers in rules will extend this one
        {
            graphicWidth: 21,
            graphicHeight: 25,
            graphicYOffset: -28, // shift graphic up 28 pixels
            label: "${help_mi}" // label will be foo attribute value
        },
        // the second argument will include all rules
        {
            rules: [
                new OpenLayers.Rule({
                    // a rule contains an optional filter
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.LESS_THAN,
                        property: "foo", // the "foo" feature attribute
                        value: 25
                    }),
                    // if a feature matches the above filter, use this symbolizer
                    symbolizer: {
                        externalGraphic: "img/marker-blue.png"
                    }
                }),
                new OpenLayers.Rule({
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.BETWEEN,
                        property: "foo",
                        lowerBoundary: 25,
                        upperBoundary: 50
                    }),
                    symbolizer: {
                        externalGraphic: "img/marker-green.png"
                    }
                }),
                new OpenLayers.Rule({
                    filter: new OpenLayers.Filter.Comparison({
                        type: OpenLayers.Filter.Comparison.BETWEEN,
                        property: "foo",
                        lowerBoundary: 50,
                        upperBoundary: 75
                    }),
                    symbolizer: {
                        externalGraphic: "img/marker-gold.png"
                    }
                }),
                new OpenLayers.Rule({
                    // apply this rule if no others apply
                    elseFilter: true,
                    symbolizer: {
                        externalGraphic: "img/marker.png"
                    }
                })
            ]
        }
    );
    
	
	
}

function localizzami() {
  if(navigator.geolocation) {
	navigator.geolocation.getCurrentPosition(geolocation,errorGettingPosition,{timeout:7000});
  } else {
		alert('DEVI INSERIRE LA POSIZIONE MAUALMENTE');
  }
}

function geolocation(position){
	markerHere_layer.removeMarker(markerHere);
	posHere = new OpenLayers.LonLat(position.coords.longitude, position.coords.latitude).transform("EPSG:4326", "EPSG:900913");
	markerHere = new OpenLayers.Marker(posHere,icon);
	markerHere_layer.addMarker(markerHere);
	map.setCenter(posHere);
}

function errorGettingPosition(err){
	alert('Rilevamento automatico della posizione non funzionante');
}

function spostami_start(){
	drag.activate();
}

function spostami_stop(){
	drag.deactivate();
}

function calcola_percorso(){
/*
http://routes.cloudmade.com/<APIKEY>/api/0.3/start_point,[[transit_point1,...,transit_pointN]],end_point/route_type[/route_type_modifier].output_format[?lang=(en|de)][&units=(km|miles)]
    start_point - latitude, longitude of the start point of the route separated by the comma (lat,lon)
    end_point - latitude, longitude of the end point of the route separated by the comma (lat,lon)
    route_type - type of the route ("car", "foot", "bicycle")
    output_format - format of the output results ("js", "gpx")
    transit_points - list of points (lat,lon) that the route must visit (in specified order) before reach end_point. List of transit points should be passed in square brackets, e.g [51.2227,4.4120,51.2,4.41]
    route_type_modifier - modifier of the route type, for now only valid value is "shortest" for route type "car"
    lang - iso 2 characters code for language for the route instructions, if missing taken from the Accept-Language header, default is en. Possible values are listed on Documentation page.
    units - measure units for distance calculation (km or miles). Default - km
    callback - optional parameter for JS response, if specified response will be wrapped into the function call. e.g. if callback=routeLoaded, response will be routeLoaded(JSON_object)
*/
/*	var start_point = (47.25976,9.58423);
	var url = "http://routes.cloudmade.com/8ee2a50541944fb9bcedded5165f09d9/api/0.3/47.25976,9.58423,47.26117,9.59882/bicycle.js";
	var options = {	projection: map.displayProjection,
					strategies: [new OpenLayers.Strategy.Fixed()],
					protocol: new OpenLayers.Protocol.HTTP({url: url,
															format: new OpenLayers.Format.GeoJSON()
															})
					};
var route_layer = new OpenLayers.Layer.Vector("GeoJSON", options);
map.addLayer(route_layer);*/
	from = posHere;
	from.transform("EPSG:900913", "EPSG:4326"); //new OpenLayers.LonLat(9.58423, 47.25976);
	to = markerSelected;
	to.transform("EPSG:900913", "EPSG:4326"); //new OpenLayers.LonLat(9.59882, 47.26117);
	alert(to.x + ', ' + to.y);
	//to = new OpenLayers.LonLat(9.59882, 47.26117);
	addScript ('http://routes.cloudmade.com/BC9A493B41014CAABB98F0471D759707/api/0.3/' + from.lat + ',' + from.lon + ',' + to.y + ',' + to.x + '/car.js?callback=getRoute');
	posHere = from.transform("EPSG:4326", "EPSG:900913");
	map.setCenter(posHere);
}

//
function addScript (url) {
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.src = url;
	document.getElementsByTagName('head')[0].appendChild(script);
}
		
function getRoute (response) {
	if(response.status==0){
		var point,
			geometry,
			feature,
			points = [];
		for (var i = 0; i < response.route_geometry.length; i++) {
		   point = new OpenLayers.Geometry.Point(response.route_geometry[i][1], response.route_geometry[i][0]);
		   points.push(point.transform("EPSG:4326", "EPSG:900913"));
		}
		geometry = new OpenLayers.Geometry.LineString(points);
		feature = new OpenLayers.Feature.Vector(geometry, null, {
			strokeColor: "#0033ff",
			strokeOpacity: 0.7,
			strokeWidth: 5
		});
		var check = percorso_layer.features;
		if(check.length > 0){ percorso_layer.removeAllFeatures(); }
		percorso_layer.addFeatures(feature);
	} else {
		alert(response.status_message);
		}
}
