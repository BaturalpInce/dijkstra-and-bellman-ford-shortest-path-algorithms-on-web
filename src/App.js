import React, { useState, useEffect, useRef } from 'react';
import { Button } from 'primereact/button';
import { InputText } from 'primereact/inputtext';
import { Dropdown } from 'primereact/dropdown';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { ScrollPanel } from 'primereact/scrollpanel';
import { Toast } from 'primereact/toast';
import PriorityQueue from 'js-priority-queue';

import "primereact/resources/themes/lara-light-cyan/theme.css";
import './App.css';
import Graph from './components/Graph';

function App() {
  const [mode, setMode] = useState("input");
  const [nodeNumber, setNodeNumber] = useState(0);
  const [error, setError] = useState("");
  const [topologyLoading, setTopologyLoading] = useState(false);
  const [networkData, setNetworkData] = useState({ nodes: [], edges: [] });
  const [selectedSourceNode, setSelectedSourceNode] = useState("");
  const [selectedDestinationNode, setSelectedDestinationNode] = useState("");
  const [nodeOptions, setNodeOptions] = useState([]);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("");
  const [forwardingTableContents, setForwardingTableContents] = useState([]);
  const [distanceComputed, setDistanceComputed] = useState(0);
  const [shortestPath, setShortestPath] = useState([]);
  const [algorithmRunTime, setAlgorithmRunTime] = useState(0);

  const algoirthmOptions = [
    "Dijkstra", "Bellman Ford"
  ];

  const toast = useRef(null);
  const displayToast = (message, type, severity) => {
    toast.current.show({ severity: severity, summary: type, detail: message });
  };  

  const generateNetworkTopology = () => {
    if(nodeNumber <= 0){
      setError("Please Enter a Positive Number.");
    }
    else{
      setTopologyLoading(true);
      setError("");
      const generatedNodes = [];
      const generatedEdges = [];

      for(let i = 0; i < nodeNumber; i++){
        generatedNodes.push({ id: `Node ${i}` });
      }

      for(let i = 0; i < nodeNumber; i++){
        for(let j = i + 1; j < nodeNumber; j++){
          // I connect nodes randomly too but change the chance of connection on different input values because if user enter too big number than I should generate less connection per node to render an optimal network topology
          const randomNumber = Math.random();
          
          if(generatedNodes.length > 400){
            if(randomNumber < 0.005){
              const randomDistanceBetweenNodes = Math.floor(Math.random() * 100) + 1;
              generatedEdges.push({ source: `Node ${i}`, target: `Node ${j}`, label: randomDistanceBetweenNodes.toString() });
            }
          }
          else if(generatedNodes.length > 200){
            if(randomNumber < 0.01){
              const randomDistanceBetweenNodes = Math.floor(Math.random() * 100) + 1;
              generatedEdges.push({ source: `Node ${i}`, target: `Node ${j}`, label: randomDistanceBetweenNodes.toString() });
            }
          }
          else if(generatedNodes.length > 100){
            if(randomNumber < 0.04){
              const randomDistanceBetweenNodes = Math.floor(Math.random() * 100) + 1;
              generatedEdges.push({ source: `Node ${i}`, target: `Node ${j}`, label: randomDistanceBetweenNodes.toString() });
            }
          }
          else if(generatedNodes.length > 50){
            if(randomNumber < 0.08){
              const randomDistanceBetweenNodes = Math.floor(Math.random() * 100) + 1;
              generatedEdges.push({ source: `Node ${i}`, target: `Node ${j}`, label: randomDistanceBetweenNodes.toString() });
            }
          }
          else if(generatedNodes.length > 30){
            if(randomNumber < 0.15){
              const randomDistanceBetweenNodes = Math.floor(Math.random() * 100) + 1;
              generatedEdges.push({ source: `Node ${i}`, target: `Node ${j}`, label: randomDistanceBetweenNodes.toString() });
            }
          }
          else if(generatedNodes.length > 10){
            if(randomNumber < 0.3){
              const randomDistanceBetweenNodes = Math.floor(Math.random() * 100) + 1;
              generatedEdges.push({ source: `Node ${i}`, target: `Node ${j}`, label: randomDistanceBetweenNodes.toString() });
            }
          }
          else{            
            if(randomNumber < 0.5){
              const randomDistanceBetweenNodes = Math.floor(Math.random() * 100) + 1;
              generatedEdges.push({ source: `Node ${i}`, target: `Node ${j}`, label: randomDistanceBetweenNodes.toString() });
            }
          }
        }
      }

      setNetworkData({ nodes: generatedNodes, edges: generatedEdges });
      setTopologyLoading(false);
      setMode("generatedtopology");
    }
  }

  useEffect(() => {
    setNodeOptions(networkData.nodes.map(node => ({ 
      label: node.id,
      value: node.id
    })));
  }, [networkData])
  
  const runTheAlgorithm = () => {
    if(selectedSourceNode !== "" && selectedDestinationNode !== "" && selectedAlgorithm !== ""){
      resetOutputsOnly();
      if(selectedAlgorithm === "Dijkstra"){
        const runDijkstra = dijkstraAlgorithm();
        if(runDijkstra === "Could not find a path"){
          displayToast("Could not find a path", "Error", "error");
        }
        else{
          setForwardingTableContents(Object.entries(runDijkstra.forwardingtable).map(([node, shortest]) => ({ node, shortest })));
          setDistanceComputed(runDijkstra.distance);
          setShortestPath(runDijkstra.path);
        }
      }
      else if(selectedAlgorithm === "Bellman Ford"){
        const runBellmanFord = bellmanFordAlgorithm();
        if(runBellmanFord === "Could not find a path"){
          displayToast("Could not find a path", "Error", "error");
        }
        else{
          setForwardingTableContents(Object.entries(runBellmanFord.forwardingtable).map(([node, shortest]) => ({ node, shortest })));
          setDistanceComputed(runBellmanFord.distance);
          setShortestPath(runBellmanFord.path);  
        }
      }
    }
    else{
      displayToast("Select a Node on Both Source and Destination. Also select an Algorithm", "Error", "error");
    }
  }

  const dijkstraAlgorithm = () => {
    let initialTime = performance.now();
    let priorityque = new PriorityQueue({comparator: (node1, node2) => node1.distance - node2.distance});
    let distanceArray = {};
    let previousArray = {};

    networkData.nodes.forEach(node => {
      previousArray[node.id] = null;
      distanceArray[node.id] = Infinity;
    });
    distanceArray[selectedSourceNode] = 0;
    priorityque.queue({ id: selectedSourceNode, distance: 0});
    
    while(priorityque.length > 0){
      var { id: initialNode } = priorityque.dequeue();
      var neighbourList = networkData.edges.filter(edge => edge.source === initialNode || edge.target === initialNode);
      
      neighbourList.forEach(neighbour => {
        let target;
        if(neighbour.source === initialNode){
          target = neighbour.target;
        }
        else{
          target = neighbour.source;
        }
        let alternativeShortestPath = parseInt(neighbour.label) + distanceArray[initialNode];

        if(alternativeShortestPath < distanceArray[target]){
          distanceArray[target] = alternativeShortestPath;
          previousArray[target] = initialNode;
          priorityque.queue({ id: target, distance: alternativeShortestPath});
        }
      });
    }

    // finding shortest path
    let shortestPathOfNodes = [];
    for(var i = selectedDestinationNode; i !== null; i = previousArray[i]){
      shortestPathOfNodes.push(i);
    }
    shortestPathOfNodes.reverse();

    let endTime;
    if(shortestPathOfNodes[0] !== selectedSourceNode){
      endTime = performance.now();
      setAlgorithmRunTime(endTime - initialTime);
      return "Could not find a path";
    }
    else{
      const returnPathAndDistance = {
        path: shortestPathOfNodes,
        distance: distanceArray[selectedDestinationNode],
        forwardingtable: previousArray
      }
      endTime = performance.now();
      setAlgorithmRunTime(endTime - initialTime);

      return returnPathAndDistance;
    }
  }

  const bellmanFordAlgorithm = () => {
    const initialTime = performance.now();
    // Bellman Ford Algorithm does not work on undirected edges and since my generated topology has undirected edges, I can convert the edges to directed by adding a reversed source and target edge with same distance value for each edge. Therefore, Bellman Ford Algorithm could be applied to the new set of directed edges.
    const directedEdges = networkData.edges.flatMap(edge => [
      edge,
      { ...edge, source: edge.target, target: edge.source }
    ]);

    let distanceArray = {};
    let previousArray = {};

    networkData.nodes.forEach(node => {
      previousArray[node.id] = null;
      distanceArray[node.id] = Infinity;
    });
    distanceArray[selectedSourceNode] = 0;

    for(var i = 0; i < networkData.nodes.length - 1; i++){
      directedEdges.forEach(edge => {
        var edgeDistance = parseInt(edge.label);
        if(edgeDistance + distanceArray[edge.source] < distanceArray[edge.target]){
          distanceArray[edge.target] = edgeDistance + distanceArray[edge.source];
          previousArray[edge.target] = edge.source;
        }
      });
    }

    // shortest path is computed similarly to Dijkstra
    let shortestPathOfNodes = [];
    for(var i = selectedDestinationNode; i !== null; i = previousArray[i]){
      shortestPathOfNodes.push(i);
    }
    shortestPathOfNodes.reverse();

    let endTime;
    if(shortestPathOfNodes[0] !== selectedSourceNode){
      endTime = performance.now();
      setAlgorithmRunTime(endTime - initialTime);
      return "Could not find a path";
    }
    else{
      const returnPathAndDistance = {
        path: shortestPathOfNodes,
        distance: distanceArray[selectedDestinationNode],
        forwardingtable: previousArray
      }
      endTime = performance.now();
      setAlgorithmRunTime(endTime - initialTime);

      return returnPathAndDistance;
    }
  }

  const resetOutputsOnly = () => {
    setForwardingTableContents([]);
    setDistanceComputed(0);
    setShortestPath("");
    setAlgorithmRunTime(0);
  }

  const resetEverything = () => {
    setSelectedSourceNode("");
    setSelectedDestinationNode("");
    setSelectedAlgorithm("");
    setForwardingTableContents([]);
    setDistanceComputed(0);
    setShortestPath("");
    setAlgorithmRunTime(0);
  }

  const returnToHome = () => {
    resetEverything();
    setMode("input");
  }
 
  return (
    <div className="maindiv">
      <Toast ref={toast} />
      { mode === "input" && 
      <div className='inputdiv'>
        <div className="inputbox">
            <label htmlFor="nodeno">Number of Nodes on Network</label>
            <div className='inputandbutton'>
              <InputText id="nodeno" aria-describedby="nodeno-help" value={nodeNumber} onChange={(e) => setNodeNumber(e.target.value)} />
              <Button label='Confirm' onClick={() => generateNetworkTopology()} loading={topologyLoading}/>
            </div>
            <small id="nodeno-help">
                Enter the amount of nodes to be generated for the network. 
            </small>
            <small id="nodeno-help">
                Topology Generation might take longer time for input bigger than 200. 
            </small>
            { error !== "" && 
            <label style={{color: 'red'}}>{error}</label>
            }
        </div>
      </div>
      }
      { mode === "generatedtopology" && 
        <div className='maintopologydiv'>
          <Graph networkData={networkData} />
          <div className='operationsdiv'>
            <div className='flexcoldiv'>
              <div className='flexdiv'>
                <h5>Select Source Node</h5>
                <Dropdown value={selectedSourceNode} onChange={(e) => setSelectedSourceNode(e.value)} options={nodeOptions}
          placeholder="Select" style={{width: '175px'}} />
              </div>
              <div className='flexdiv'>
                <h5>Select Destination Node</h5>
                <Dropdown value={selectedDestinationNode} onChange={(e) => setSelectedDestinationNode(e.value)} options={nodeOptions}
          placeholder="Select" style={{width: '175px'}} />
              </div>
            </div>
            <h5>Select an Algorithm</h5>
            <Dropdown value={selectedAlgorithm} onChange={(e) => setSelectedAlgorithm(e.value)} options={algoirthmOptions}
    placeholder="Select algorithm"  style={{width: '250px'}}  />
            <Button onClick={() => runTheAlgorithm()} label='Run' className='buttonrun'  />
            <Button onClick={() => resetEverything()} label='Reset' className='buttonrun'  />
            <div className='outputsdiv'>
              <h2>Outputs</h2>
              <h5>Shortest Path From Source to Destination: </h5>
              <ScrollPanel style={{ width: '90%', alignSelf: 'center', textAlign: 'center' }}>
                  <div>
                      {shortestPath.length !== 0 && shortestPath.map((node, index) => (
                          <span key={index}>
                              {node} {index < shortestPath.length - 1 && '-> '}
                          </span>
                      ))}
                  </div>
              </ScrollPanel>
              <h5>Packet Transmission Delay: {distanceComputed * 20} ms </h5>
              <h5>Total Cost (Distance) of Path Choosen: {distanceComputed} </h5>
              <h5>Run Time of the Algorithm: {algorithmRunTime} ms </h5>
              <h5>Number of Hop Counts: {shortestPath.length - 1} </h5>
              <h2>Forwarding Table: </h2>
              <DataTable value={forwardingTableContents} paginator rows={4}>
                <Column field="node" header="Node"></Column>
                <Column field="shortest" header="Shortest Link Node"></Column>
              </DataTable>
              <Button className='returnbutton' label='Return to Home' onClick={() => returnToHome()}/>
            </div>
          </div>
        </div>
      }
    </div>
  );
}

export default App;
