import html2canvas from 'html2canvas';
import { getInTooltip, getOutTooltip, positionTooltip } from './tooltip';
import { setRRSSLinks } from './rrss';
import 'url-search-params-polyfill';
import * as d3 from 'd3';

//Necesario para importar los estilos de forma automática en la etiqueta 'style' del html final
import '../css/main.scss';

///// VISUALIZACIÓN DEL GRÁFICO //////
let dataSource = 'https://raw.githubusercontent.com/CarlosMunozDiazCSIC/envejecimiento_brecha-digital-2021_evolucion/main/data/evolucion_edad_tic.csv';
let tooltip = d3.select('#tooltip');

let innerData = [], nestedData = [], chartBlock = d3.select('#chart'), chart, x_c, x_cAxis, y_c, y_cAxis, line, paths;
let margin = {top: 5, right: 10, bottom: 17.5, left: 35}, width, height;
let colors = ['#78bb6e', '#6f0910', '#cecece'];

initChart();

function initChart() {
    let csv = d3.dsvFormat(';');

    d3.text(dataSource, function(err, data) {
        if(err) throw err;
        data = csv.parse(data);

        innerData = data.map(function(d) {
            return {
                anio: d.anio,
                '16_24': +d['16_24'].replace(',','.'),
                '25_34': +d['25_34'].replace(',','.'),
                '35_44': +d['35_44'].replace(',','.'),
                '45_54': +d['45_54'].replace(',','.'),
                '55_64': +d['55_64'].replace(',','.'),
                '65_74': +d['65_74'].replace(',','.')
            }
        });
        innerData = innerData.reverse();

        let keys = data.columns.slice(2);

        nestedData = keys.map(function(item) {
            let aux = [];
            innerData.map(function(d) {
                aux.push({'anio':d.anio, 'valor': d[item]});
            });
            return {'key': item, 'data': aux};            
        });

        //Desarrollo de la visualización
        width = parseInt(chartBlock.style('width')) - margin.left - margin.right,
        height = parseInt(chartBlock.style('height')) - margin.top - margin.bottom;

        chart = chartBlock
            .append("svg")
                .attr("width", width + margin.left + margin.right)
                .attr("height", height + margin.top + margin.bottom)
            .append("g")
                .attr("transform",
                    "translate(" + margin.left + "," + margin.top + ")");

        x_c = d3.scaleBand()
            .domain(nestedData[0].data.map(function(d) { return d.anio; }))
            .range([0, width]);

        chart.append("g")
            .attr("transform", "translate(0," + height + ")")
            .call(d3.axisBottom(x_c));

        // Add Y axis
        y_c = d3.scaleLinear()
            .domain([0, 100])
            .range([height, 0]);

        chart.append("g")
            .call(d3.axisLeft(y_c));

        //Línea
        line = d3.line()
            .x(function(d) { return x_c(d.anio) + x_c.bandwidth() / 2; })
            .y(function(d) { return y_c(+d.valor); })
            .curve(d3.curveNatural);

        paths = chart.selectAll(".line")
            .data(nestedData)
            .enter()
            .append("path")
            .attr('class', 'line')
            .attr("fill", "none")
            .attr("stroke", function(d){
                if (d.key == '65_74') {
                    return colors[0];
                } else {
                    return colors[2];
                }
            })
            .attr("stroke-width", 2)
            .attr('d', function(d) {
                return line(d.data);
            });

        paths.attr("stroke-dasharray", 768 + " " + 768)
            .attr("stroke-dashoffset", 768)
            .transition()
            .ease(d3.easeLinear)
            .attr("stroke-dashoffset", 0)
            .duration(3000);
    }); 
}

function updateChart(tipo) {
    //Cambiamos el color a las líneas
    console.log(tipo);

    //Cambiamos la variable


    //Ponemos los datos de la brecha
    
    
    //Hacemos nueva fotografía de la visualización
    setTimeout(() => {
        setChartCanvas();
    }, 5000);
}

function animateChart() {
    //Que evolucionen de nuevo con los mismos colores que tenían
    paths = chart.selectAll(".line")
        .attr("stroke-width", 2)
        .attr('d', function(d) {
            return line(d.data);
        });

    paths.attr("stroke-dasharray", 768 + " " + 768)
        .attr("stroke-dashoffset", 768)
        .transition()
        .ease(d3.easeLinear)
        .attr("stroke-dashoffset", 0)
        .duration(3000);

    //Hacemos nueva fotografía de la visualización
    setTimeout(() => {
        setChartCanvas();
    }, 5000);
}

document.getElementById('replay').addEventListener('click', function() {
    animateChart();
});

///// REDES SOCIALES /////
setRRSSLinks();

///// ALTURA DEL BLOQUE DEL GRÁFICO //////
function getIframeParams() {
    const params = new URLSearchParams(window.location.search);
    const iframe = params.get('iframe');

    if(iframe == 'fijo') {
        setChartHeight('fijo');
    } else {
        setChartHeight();
    }
}

///Si viene desde iframe con altura fija, ejecutamos esta función. Si no, los altos son dinámicos a través de PYMJS
function setChartHeight(iframe_fijo) {
    if(iframe_fijo) {
        //El contenedor y el main reciben una altura fija
        //La altura del gráfico se ajusta más a lo disponible en el main, quitando títulos, lógica, ejes y pie de gráfico
        document.getElementsByClassName('container')[0].style.height = '612px';
        document.getElementsByClassName('main')[0].style.height = '580px';

        let titleBlock = document.getElementsByClassName('b-title')[0].clientHeight;
        let logicBlock = document.getElementsByClassName('chart__logics')[0].clientHeight;
        let footerBlock = document.getElementsByClassName('chart__footer')[0].clientHeight;
        let footerTop = 8, containerPadding = 8, marginTitle = 8, marginLogics = 12;

        //Comprobar previamente la altura que le demos al MAIN. El estado base es 588 pero podemos hacerlo más o menos alto en función de nuestros intereses

        let height = 580; //Altura total del main
        document.getElementsByClassName('chart__viz')[0].style.height = height - titleBlock - logicBlock - footerBlock - footerTop - containerPadding - marginTitle - marginLogics + 'px';
    } else {
        document.getElementsByClassName('main')[0].style.height = document.getElementsByClassName('main')[0].clientHeight + 'px';
    }    
}

getIframeParams();

///// DESCARGA COMO PNG O SVG > DOS PASOS/////
let innerCanvas;
let pngDownload = document.getElementById('pngImage');

function setChartCanvas() {
    html2canvas(document.querySelector("#chartBlock"), {width: document.querySelector('#chartBlock').clientWidth, height: document.querySelector('#chartBlock').clientHeight, imageTimeout: 12000, useCORS: true}).then(canvas => { innerCanvas = canvas; });
}

function setChartCanvasImage() {    
    var image = innerCanvas.toDataURL();
    // Create a link
    var aDownloadLink = document.createElement('a');
    // Add the name of the file to the link
    aDownloadLink.download = 'envejecimiento_brecha-digital-2021_evolucion.png';
    // Attach the data to the link
    aDownloadLink.href = image;
    // Get the code to click the download link
    aDownloadLink.click();
}

pngDownload.addEventListener('click', function(){
    setChartCanvasImage();
});

///// JUEGO DE PESTAÑAS /////
//Cambios de pestañas
let tabs = document.getElementsByClassName('tab');
let contenidos = document.getElementsByClassName('content');

for(let i = 0; i < tabs.length; i++) {
    tabs[i].addEventListener('click', function(e) {
        document.getElementsByClassName('main')[0].scrollIntoView();
        displayContainer(e.target);
    });
}

function displayContainer(elem) {
    let content = elem.getAttribute('data-target');

    //Poner activo el botón
    for(let i = 0; i < tabs.length; i++) {
        tabs[i].classList.remove('active');
    }
    elem.classList.add('active');

    //Activar el contenido
    for(let i = 0; i < contenidos.length; i++) {
        contenidos[i].classList.remove('active');
    }

    document.getElementsByClassName(content)[0].classList.add('active');
}

///// USO DE SELECTORES //////
let x, i, j, l, ll, selElmnt, a, b, c;
let currentSelected = 'ninguno';
/* Look for any elements with the class "custom-select": */
x = document.getElementsByClassName("custom-select");
l = x.length;
for (i = 0; i < l; i++) {
  selElmnt = x[i].getElementsByTagName("select")[0];
  ll = selElmnt.length;
  /* For each element, create a new DIV that will act as the selected item: */
  a = document.createElement("DIV");
  a.setAttribute("class", "select-selected");
  a.innerHTML = selElmnt.options[selElmnt.selectedIndex].innerHTML;
  x[i].appendChild(a);
  /* For each element, create a new DIV that will contain the option list: */
  b = document.createElement("DIV");
  b.setAttribute("class", "select-items select-hide");
  for (j = 1; j < ll; j++) {
    /* For each option in the original select element,
    create a new DIV that will act as an option item: */
    c = document.createElement("DIV");
    let valores = selElmnt.options[j].value.split("-");
    c.setAttribute('data-value', valores[0]);
    c.setAttribute('data-type', valores[1]);
    c.innerHTML = selElmnt.options[j].innerHTML;
    c.addEventListener("click", function(e) {
        /* When an item is clicked, update the original select box,
        and the selected item: */
        let y, i, k, s, h, sl, yl;
        s = this.parentNode.parentNode.getElementsByTagName("select")[0];
        sl = s.length;
        h = this.parentNode.previousSibling;
        currentSelected = e.target.getAttribute('data-value');   
        updateChart(currentSelected);

        for (i = 0; i < sl; i++) {
          if (s.options[i].innerHTML == this.innerHTML) {
            s.selectedIndex = i;
            h.innerHTML = this.innerHTML;
            y = this.parentNode.getElementsByClassName("same-as-selected");
            yl = y.length;
            for (k = 0; k < yl; k++) {
              y[k].removeAttribute("class");
            }
            this.setAttribute("class", "same-as-selected");
            break;
          }
        }
        h.click();
    });
    b.appendChild(c);
  }
  x[i].appendChild(b);
  a.addEventListener("click", function(e) {
    /* When the select box is clicked, close any other select boxes,
    and open/close the current select box: */
    e.stopPropagation();
    closeAllSelect(this);
    this.nextSibling.classList.toggle("select-hide");
    this.classList.toggle("select-arrow-active");
  });
}

function closeAllSelect(elmnt) {
  /* A function that will close all select boxes in the document,
  except the current select box: */
  let x, y, i, xl, yl, arrNo = [];
  x = document.getElementsByClassName("select-items");
  y = document.getElementsByClassName("select-selected");
  xl = x.length;
  yl = y.length;
  for (i = 0; i < yl; i++) {
    if (elmnt == y[i]) {
      arrNo.push(i)
    } else {
      y[i].classList.remove("select-arrow-active");
    }
  }
  for (i = 0; i < xl; i++) {
    if (arrNo.indexOf(i)) {
      x[i].classList.add("select-hide");
    }
  }
}

/* If the user clicks anywhere outside the select box,
then close all select boxes: */
document.addEventListener("click", closeAllSelect);
