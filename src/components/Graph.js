import React, { useEffect, useRef } from 'react';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';

export const Graph = ({ networkData }) => {
    const graphRef = useRef(null);

    cytoscape.use(fcose);

    useEffect(() => {
        if (!networkData.nodes.length || !networkData.edges.length) {
          return;
        }
    
        const graph = cytoscape({
          container: graphRef.current,
          elements: {
            nodes: networkData.nodes.map(node => ({ data: node })),
            edges: networkData.edges.map(edge => ({ data: edge })),
          },
          style: [
            {
              selector: 'node',
              style: {
                'background-color': '#666',
                'label': 'data(id)',
                'font-size': '28px'
              }
            },
            {
              selector: 'edge',
              style: {
                'width': 2,
                'line-color': '#bbb',
                'label': 'data(label)',
              }
            }
          ],
          layout: {
            name: 'fcose',
            quality: "default",
            sampleSize: networkData.nodes.length,
            nodeSeparation: 1000,
            idealEdgeLength: edge => 500,
          },
        });
        }, [networkData]);

        return <div ref={graphRef} style={{ width: '75%', height: '100%', border: '2px solid black' }} />;
};
    
export default Graph;
