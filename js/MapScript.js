//console.log("hahaha");
var op_street = L.tileLayer.provider("OpenStreetMap"),
    esri = L.tileLayer.provider("Esri.WorldImagery"),
    CartoDB = L.tileLayer.provider("CartoDB.Voyager");

/*---- Đọc WMS Geosever ----*/
/*var base = L.tileLayer.wms('http://localhost:8080/geoserver/cite/wms?', {
    layers: 'tn_hanhchinh',
    tiled: true,
    format: 'image/png',
    transparent: true
});*/

var trees = L.icon({
    iconUrl: 'imgs/trees.png',
    iconSize: [40, 50],
    iconAnchor: [20, 35],
    shadowUrl: 'imgs/circle.png',
    shadowSize: [47, 47],
    shadowAnchor: [25, 25]
});

var bird = L.icon({
    iconUrl: 'imgs/bird.png',
    iconSize: [30, 40],
    iconAnchor: [15, 28],
    shadowUrl: 'imgs/circle.png',
    shadowSize: [30, 30],
    shadowAnchor: [15, 16]
});

var house = L.icon({
    iconUrl: 'imgs/house.png',
    iconSize: [20, 30],
    iconAnchor: [10, 20],
    shadowUrl: 'imgs/circle.png',
    shadowSize: [20, 20],
    shadowAnchor: [10, 10]
});

$.getJSON("data/base.geojson", function(base){
    $.getJSON("data/turtle.geojson", function (turtle) {
        $.getJSON("data/forest.geojson", function (forest) {
            //console.log(data);
            /*---Phải tạo LayerGroup---*/
            var turtle_vn = L.layerGroup();
            /*---Tạo Chart---*/
            var charts = {};
            for (var attr in turtle.features) {
                //console.log(ruabat.features[attr].properties)
                var props = turtle.features[attr].properties;
                var data_feat = [
                    props['2015'],
                    props['2016'],
                    props['2017'],
                    props['2018'],
                    props['2019']
                ];
                charts[props['NL_NAME_3']] = L.minichart([props['ycoord'], props['xcoord']], {
                    data: data_feat,
                    maxValues: 6,
                    width: 60,
                    height: 60,
                    labels: "auto",
                    labelColor: "auto",
                    labelStyle: "font-family:sans-serif; font-weight:bold",
                    colors: ["#ff000c", "#00f4ff", "#fff200", "#008514", "#dc34eb"]
                });
                charts[props['NL_NAME_3']].bindPopup("<div id='popup_tb'>" + "<table>" +
                    "<tbody>" +
                    "<tr>" +
                    "<td class='key_tb'> Năm 2015: </td>" + "<td>" + props['2015'] + "</td>" +
                    "</tr>" +
                    "<tr>" +
                    "<td class='key_tb'> Năm 2016: </td>" + "<td>" + props['2016'] + "</td>" +
                    "</tr>" +
                    "<tr>" +
                    "<td class='key_tb'> Năm 2017: </td>" + "<td>" + props['2017'] + "</td>" +
                    "</tr>" +
                    "<tr>" +
                    "<td class='key_tb'> Năm 2018: </td>" + "<td>" + props['2018'] + "</td>" +
                    "</tr>" +
                    "<tr>" +
                    "<td class='key_tb'> Năm 2019: </td>" + "<td>" + props['2019'] + "</td>" +
                    "</tr>" +
                    "</tbody>" +
                    "</table>" + "</div>");
                turtle_vn.addLayer(charts[props['NL_NAME_3']]);
            }

            /*--- Search Bar ---*/
            var forest_search = L.geoJSON(forest, {
                pointToLayer: function (feature, latlng) {
                    return L.marker(latlng, {opacity: 0});
                }
            });
            var search = L.control.search({
                position: 'topleft',
                layer: forest_search,
                initial: false,
                zoom: 13,
                marker: false,
                propertyName: 'ORIG_NAME',
                textPlaceholder: 'search...'
            });
            var forest_tn = L.geoJSON(forest, {
                onEachFeature(feature, layer) {
                    // does this feature have a property named popupContent?
                    if (feature.properties && feature.properties.ORIG_NAME) {
                        layer.bindPopup(feature.properties.ORIG_NAME);
                    }
                },
                pointToLayer: function (feat, latlng) {
                    //console.log(feat.properties.Type_Desig);
                    if (feat.properties.Type_Desig == 1) {
                        return L.marker(latlng, {icon: trees});
                    } else if (feat.properties.Type_Desig == 2) {
                        return L.marker(latlng, {icon: bird});
                    } else {
                        return L.marker(latlng, {icon: house});
                    }
                }
            });

            var base_tn = L.geoJSON(base, {
                style: {
                    "color": "#ff7800",
                    "opacity": 0.5
                }
            });

            var map = L.map('mymap', {
                    center: [13.125, 106.134],
                    zoom: 7,
                    layers: [op_street, base_tn, turtle_vn, forest_tn],
                    zoomControl: false
                }
            );
            var zoomHome = L.Control.zoomHome();
            zoomHome.addTo(map);
            search.addTo(map);

            var drawnItems = L.featureGroup().addTo(map);
            var baseMaps = {
                "OpenStreetMap": op_street.addTo(map),
                "Esri.WorldImagery": esri,
                "Carto Map": CartoDB,
            };

            var overlayMaps = {
                "Tỉnh": base_tn,
                "Rùa biển": turtle_vn,
                "Rừng": forest_tn,
                //"Draw Layers": drawnItems
            };

            /*---leaflet Draw---*/
            map.addControl(new L.Control.Draw({
                //position: 'topright',
                edit: {
                    featureGroup: drawnItems,
                    poly: {
                        allowIntersection: true
                    },
                },
                draw: {
                    polygon: {
                        allowIntersection: true,
                        showArea: true,
                        shapeOptions: {
                            color: '#0018da'
                        }
                    },
                    circle: false,
                    polyline: false,
                    circlemarker: false
                }
            }));
            map.on(L.Draw.Event.CREATED, function (event) {
                var layer = event.layer;
                drawnItems.addLayer(layer);
            });

            var control = L.control.layers(baseMaps, overlayMaps, {collapsed: false}).addTo(map);

            var forest_legend = L.control({position: 'bottomleft'});
            forest_legend.onAdd = map => {
                var div = L.DomUtil.create('div', 'info legend'),
                    grades = ["Vườn quốc gia", "Khu bảo vệ cảnh quan", "Khu bảo tồn thiên nhiên"],
                    labels = ["imgs/trees.png", "imgs/bird.png", "imgs/house.png"];

                div.innerHTML = "<div class='legend' style='margin-right: 10px'>" + ("<p class='title-legend'>Bảo tồn thiên nhiên</p>") +
                    ("<div class='container'>" +
                        "<div id='overlay0'></div>" +
                        "<img src=" + labels[0] + " width='40' height='50' style='margin:0px 0px 0px 5px'>" +
                        "<span class='label_legend'>" + grades[0] + "</span>" +
                        "</div>") + '<br>' +
                    ("<div class='container'>" +
                        "<div id='overlay1'></div>" +
                        " <img src=" + labels[1] + " width='30' height='40' style='margin:0px 0px 0px 10px'>" +
                        "<span class='label_legend'>" + grades[1] + "</span>" +
                        "</div>") + '<br>' +
                    ("<div class='container'>" +
                        "<div id='overlay2'></div>" +
                        " <img src=" + labels[2] + " width='20' height='30' style='margin:0px 0px 0px 20px'>" +
                        "<span class='label_legend'>" + grades[2] + "</span>" +
                        "</div>") + '<br>' +
                    "</div>";
                var draggable = new L.Draggable(div);
                draggable.enable()
                return div;
            };
            forest_legend.addTo(map);

            var turtle_legend = L.control({position: 'bottomright'});
            turtle_legend.onAdd = map => {
                var div = L.DomUtil.create('div', 'info legend');

                div.innerHTML = "<div class='legend' style='margin-right: 10px'>" + ("<p class='title-legend'>Số lượng rùa biển bắt (con)</p>") +
                    ("<div class='container_rec'>" +
                        "<div id='rec1'></div>" +
                        "<span class='label_legend_rec'>" + "Năm 2015" + "</span>" +
                        "</div>") + '<br>' +
                    ("<div class='container_rec'>" +
                        "<div id='rec2'></div>" +
                        "<span class='label_legend_rec'>" + "Năm 2016" + "</span>" +
                        "</div>") + '<br>' +
                    ("<div class='container_rec'>" +
                        "<div id='rec3'></div>" +
                        "<span class='label_legend_rec'>" + "Năm 2017" + "</span>" +
                        "</div>") + '<br>' +
                    ("<div class='container_rec'>" +
                        "<div id='rec4'></div>" +
                        "<span class='label_legend_rec'>" + "Năm 2018" + "</span>" +
                        "</div>") + '<br>' +
                    ("<div class='container_rec'>" +
                        "<div id='rec5'></div>" +
                        "<span class='label_legend_rec'>" + "Năm 2019" + "</span>" +
                        "</div>") + '<br>' +
                    "</div>";
                var draggable = new L.Draggable(div);
                draggable.enable()
                return div;
            };
            turtle_legend.addTo(map);

            map.on("overlayadd", function (e) {
                if (e.name == "Rùa biển") {
                    turtle_legend.addTo(this);
                } else if (e.name == "Rừng") {
                    forest_legend.addTo(this);
                }
            });

            map.on("overlayremove", function (e) {
                if (e.name == "Rùa biển") {
                    map.removeControl(turtle_legend);
                } else if (e.name == "Rừng") {
                    map.removeControl(forest_legend);
                }
            });
        });
    })
})
/*----Function cũ chưa thể chèn các lớp dữ liệu vào layer để hiển thị toàn bọ leaflet()----*/
/*var map = L.map('mymap', {
        center: [13.125, 106.134],
        zoom: 7,
        layers: [op_street, base],
        zoomControl: false
    },
    geojsonOpts = {
        pointToLayer: function (feature, latlng) {
            return L.marker(latlng, {opacity: 0});
        }
    }
);
var zoomHome = L.Control.zoomHome();
zoomHome.addTo(map);

var baseMaps = {
    "OpenStreetMap": op_street.addTo(map),
    "Esri.WorldImagery": esri,
    "Carto Map": CartoDB
};

function addLegend() {
    var legend = L.control({position: 'bottomleft'});
    legend.onAdd = function (map) {
        var div = L.DomUtil.create('div', 'info legend'),
            grades = ["Vườn quốc gia", "Khu bảo vệ cảnh quan", "Khu bảo tồn thiên nhiên"],
            labels = ["imgs/trees.png", "imgs/bird.png", "imgs/house.png"];

        div.innerHTML = "<div id='legend' style='margin-right: 10px'>" + ("<h2 id='title-legend'>Chú giải</h2>") +
            ("<div class='container'>" +
                "<div id='overlay0'></div>" +
                " <img src=" + labels[0] + " width='40' height='50' style='margin:0px 0px 0px 5px'>" +
                "<span class='label_legend'>" + grades[0] + "</span>" +
                "</div>") + '<br>' +
            ("<div class='container'>" +
                "<div id='overlay1'></div>" +
                " <img src=" + labels[1] + " width='30' height='40' style='margin:0px 0px 0px 10px'>" +
                "<span class='label_legend'>" + grades[1] + "</span>" +
                "</div>") + '<br>' +
            ("<div class='container'>" +
                "<div id='overlay2'></div>" +
                " <img src=" + labels[2] + " width='20' height='30' style='margin:0px 0px 0px 20px'>" +
                "<span class='label_legend'>" + grades[2] + "</span>" +
                "</div>") + '<br>' +

            ("<div class='container'>" +
                "<div id='rec1'></div>" +
                "<span class='label_legend_rec'>" + "Năm 2015" + "</span>" +
                "</div>") + '<br>' +
            ("<div class='container'>" +
                "<div id='rec2'></div>" +
                "<span class='label_legend_rec'>" + "Năm 2016" + "</span>" +
                "</div>") + '<br>' +
            ("<div class='container'>" +
                "<div id='rec3'></div>" +
                "<span class='label_legend_rec'>" + "Năm 2017" + "</span>" +
                "</div>") + '<br>' +
            ("<div class='container'>" +
                "<div id='rec4'></div>" +
                "<span class='label_legend_rec'>" + "Năm 2018" + "</span>" +
                "</div>") + '<br>' +
            ("<div class='container'>" +
                "<div id='rec5'></div>" +
                "<span class='label_legend_rec'>" + "Năm 2019" + "</span>" +
                "</div>") + '<br>' +
            "</div>";

        var draggable = new L.Draggable(div);
        draggable.enable()
        return div;
    };
    legend.addTo(map);
    map.on('overlayadd', e => $(`.legend > span:contains(${e.name})`).toggle());
    map.on('overlayremove', e => $(`.legend > span:contains(${e.name})`).toggle());
};
addLegend();*/
/*---- Phải đổi Geojson sang JS mới có thể sử dụng ----*/
/*var forest_search = L.geoJSON(forest_search, geojsonOpts);
L.control.search({
    position: 'topleft',
    layer: forest_search,
    initial: false,
    zoom: 13,
    marker: false,
    propertyName: 'ORIG_NAME',
    textPlaceholder: 'search...'
}).addTo(map);*/

/*---- Function cũ để gọi điểm theo thứ tự ----*/
/*function Style_forest(data){
    for(var feature in data.features)
    {
        var props = data.features[feature].properties;
        for (var attr in props) {
            // console.log(attr);
            // console.log(props[attr]);
            if (attr == "Type_Desig") {
                if (props[attr] == 1) {
                    L.marker([props["ycoord"], props["xcoord"]], {icon: circle1}).addTo(map);
                    L.marker([props["ycoord"], props["xcoord"]], {icon: trees}).addTo(map);
                } else if (props[attr] == 2) {
                    L.marker([props["ycoord"], props["xcoord"]], {icon: circle2}).addTo(map);
                    L.marker([props["ycoord"], props["xcoord"]], {icon: bird}).addTo(map);
                } else {
                    L.marker([props["ycoord"], props["xcoord"]], {icon: circle3}).addTo(map);
                    L.marker([props["ycoord"], props["xcoord"]], {icon: house}).addTo(map);
                }
            }
        }
    }
}*/