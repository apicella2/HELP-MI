var map;
//var markerHere_layer;
//var geolocate;
//var overlay;

function init() {
	//alert('via');
    map = new OpenLayers.Map({
        div: "map",
        projection: new OpenLayers.Projection("EPSG:900913")
    });
    
    var osm = new OpenLayers.Layer.OSM();            
    var gmap = new OpenLayers.Layer.Google("Google Streets");
    
    map.addLayers([osm, gmap]);

    map.addControl(new OpenLayers.Control.LayerSwitcher());

    map.setCenter(
        new OpenLayers.LonLat(10.2, 48.9).transform(
            new OpenLayers.Projection("EPSG:4326"),
            map.getProjectionObject()
        ), 
        5
    );
}

function aspetta(){
	map = new OpenLayers.Map({
			div: "map",
			projection: new OpenLayers.Projection("EPSG:900913")// "EPSG:3857",
			layers: [new OpenLayers.Layer.OSM()]//,
			//center: //myLocation.getBounds().getCenterLonLat(),
			//zoom: 15,
			/*eventListeners: {
				featureclick: function(e) {
					alert("Map says: " + e.feature.id + " clicked on " + e.feature.layer.name);
				}
			}*/
		});
    map.setCenter(
        new OpenLayers.LonLat(10.2, 48.9).transform(
            new OpenLayers.Projection("EPSG:4326"),
            map.getProjectionObject()
        ), 
        5
    );
// geolocate
	markerHere_layer = new OpenLayers.Layer.Vector('vector'); // layer per la sola posizione
	geolocate = new OpenLayers.Control.Geolocate({
		bind: false,
		geolocationOptions: {
			enableHighAccuracy: false,
			maximumAge: 0,
			timeout: 7000
		}
	});
	map.addControl(geolocate);
	var firstGeolocation = true; // vedere poi se serve
	var style = {
		fillColor: '#000',
		fillOpacity: 0.1,
		strokeWidth: 0
	};
	geolocate.events.register("locationupdated",geolocate,function(e) {
		markerHere_layer.removeAllFeatures();
		var circle = new OpenLayers.Feature.Vector(
			OpenLayers.Geometry.Polygon.createRegularPolygon(
				new OpenLayers.Geometry.Point(e.point.x, e.point.y),
				e.position.coords.accuracy/2,
				40,
				0
			),
			{},
			style
		);
		markerHere_layer.addFeatures([
			new OpenLayers.Feature.Vector(
				e.point,
				{},
				{
					graphicName: 'cross',
					strokeColor: '#f00',
					strokeWidth: 2,
					fillOpacity: 0,
					pointRadius: 10
				}
			),
			circle
		]);
		if (firstGeolocation) {
			map.zoomToExtent(markerHere_layer.getDataExtent());
			firstGeolocation = false;
			this.bind = true;
		}
	});
	geolocate.events.register("locationfailed",this,function() {
		//OpenLayers.Console.log('Location detection failed');
		alert('Ricerca posizione fallita');
	});
	
	carica_dati();
}

function localizzami(){
		markerHere_layer.removeAllFeatures();
		geolocate.deactivate();
		geolocate.watch = false;
		firstGeolocation = true;
		geolocate.activate();
/*
	var myLocation = new OpenLayers.Geometry.Point(10.2, 48.9)
			.transform('EPSG:4326', 'EPSG:3857');
*/

//	map.setCenter(new OpenLayers.LonLat(lon, lat), zoom);
}



function carica_dati(){
	var style = new OpenLayers.StyleMap({
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
	});

	var layerListeners = {
		featureclick: function(e) {
			log(e.object.name + " says: " + e.feature.id + " clicked.");
			return false;
		},
		nofeatureclick: function(e) {
			log(e.object.name + " says: No feature clicked.");
		}
	};

	var geojson_format = new OpenLayers.Format.GeoJSON();

	overlay = new OpenLayers.Layer.Vector('Overlay', {
		styleMap: style,
		eventListeners: layerListeners
	});

	overlay.addFeatures(geojson_format.read(data));
	map.addLayer(overlay);

	var sf = new OpenLayers.Control.SelectFeature(overlay);
	sf.activate();
}












