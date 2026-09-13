import React, { useState, useMemo, useCallback, useEffect } from "react";
import { 
  ReactFlow, 
  MiniMap, 
  Controls, 
  Background, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Handle,
  Position,
  Panel,
  MarkerType,
  Connection,
  Edge
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { 
  Network, 
  Search, 
  Filter, 
  HelpCircle, 
  ArrowUpRight, 
  Users, 
  Hash, 
  Folder, 
  Sparkles, 
  Database,
  ArrowRight,
  Info,
  Layers,
  Plus,
  Trash2,
  Minimize2,
  X
} from "lucide-react";

// Definitions of Custom Node data
interface GraphNodeData {
  nodeType: "project" | "channel" | "decision" | "expert";
  label: string;
  subtitle?: string;
  description?: string;
  isSelected?: boolean;
}

// Custom Node Component to display in React Flow
const CustomNodeComponent = ({ data }: { data: GraphNodeData }) => {
  const getIcon = () => {
    switch (data.nodeType) {
      case "project": return <Folder className="w-4 h-4 text-indigo-500" />;
      case "channel": return <Hash className="w-4 h-4 text-purple-500" />;
      case "decision": return <Sparkles className="w-4 h-4 text-amber-500" />;
      case "expert": return <Users className="w-4 h-4 text-emerald-500" />;
      default: return <Database className="w-4 h-4 text-zinc-500" />;
    }
  };

  const getBorderColor = () => {
    if (data.isSelected) return "border-indigo-600 dark:border-indigo-400 ring-2 ring-indigo-500/20 dark:ring-indigo-400/20 scale-102";
    switch (data.nodeType) {
      case "project": return "border-indigo-500/40 dark:border-indigo-500/30 hover:border-indigo-500";
      case "channel": return "border-purple-500/40 dark:border-purple-500/30 hover:border-purple-500";
      case "decision": return "border-amber-500/40 dark:border-amber-500/30 hover:border-amber-500";
      case "expert": return "border-emerald-500/40 dark:border-emerald-500/30 hover:border-emerald-500";
      default: return "border-zinc-200 dark:border-zinc-800 hover:border-zinc-400";
    }
  };

  const getBgColor = () => {
    if (data.isSelected) return "bg-indigo-50/70 dark:bg-indigo-950/20";
    return "bg-white dark:bg-zinc-900";
  };

  return (
    <div 
      className={`px-4 py-3 rounded-xl border ${getBorderColor()} ${getBgColor()} shadow-xs hover:shadow-sm transition-all duration-200 min-w-[180px] text-zinc-900 dark:text-zinc-100`}
      id={`custom-node-${data.label.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <Handle type="target" position={Position.Top} className="!bg-zinc-300 dark:!bg-zinc-700 !w-2 !h-2" />
      <div className="flex items-start space-x-2.5">
        <div className="p-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800 shrink-0">
          {getIcon()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[9px] font-mono font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {data.nodeType}
          </p>
          <p className="text-xs font-semibold truncate leading-tight mt-0.5">{data.label}</p>
          {data.subtitle && (
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate mt-0.5">{data.subtitle}</p>
          )}
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="!bg-zinc-300 dark:!bg-zinc-700 !w-2 !h-2" />
    </div>
  );
};

// Register Custom Node Types
const nodeTypes = {
  custom: CustomNodeComponent,
};

export default function KnowledgeGraphView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState<any | null>(null);

  // New Node Form states
  const [newNodeLabel, setNewNodeLabel] = useState("");
  const [newNodeType, setNewNodeType] = useState<"project" | "channel" | "decision" | "expert">("decision");
  const [newNodeSubtitle, setNewNodeSubtitle] = useState("");
  const [newNodeDesc, setNewNodeDesc] = useState("");

  const initialNodes = useMemo(() => [
    {
      id: "proj-core",
      type: "custom",
      position: { x: 300, y: 220 },
      data: { 
        nodeType: "project", 
        label: "Chronicle AI Platform", 
        subtitle: "Core SaaS Suite", 
        description: "Central reasoning engine analyzing Slack discussions to index organizational memories and build real-time knowledge graphs.",
        isSelected: false
      },
    },
    {
      id: "chan-tech",
      type: "custom",
      position: { x: 50, y: 120 },
      data: { 
        nodeType: "channel", 
        label: "#tech-architecture", 
        subtitle: "84 active threads", 
        description: "Central communication channel for planning architecture patterns, API contracts, and gateway updates.",
        isSelected: false
      },
    },
    {
      id: "chan-ai",
      type: "custom",
      position: { x: 550, y: 120 },
      data: { 
        nodeType: "channel", 
        label: "#ai-retrieval-engine", 
        subtitle: "42 active threads", 
        description: "Discussion channel focusing on semantic chunking, embedding stores, Pinecone vector tables, and model indexing.",
        isSelected: false
      },
    },
    {
      id: "dec-014",
      type: "custom",
      position: { x: 550, y: 340 },
      data: { 
        nodeType: "decision", 
        label: "DEC-014: Pinecone Migrate", 
        subtitle: "Accepted • 3 weeks ago", 
        description: "Migration from Elasticsearch vector lookup to Pinecone Serverless to leverage high-dimensionality semantic indexing.",
        isSelected: false
      },
    },
    {
      id: "dec-015",
      type: "custom",
      position: { x: 50, y: 340 },
      data: { 
        nodeType: "decision", 
        label: "DEC-015: REST -> gRPC", 
        subtitle: "Proposed • 2 days ago", 
        description: "Decision to replace traditional polling with persistent gRPC streams for telemetry metrics, saving 72% server-side CPU overhead.",
        isSelected: false
      },
    },
    {
      id: "exp-elena",
      type: "custom",
      position: { x: 180, y: 10 },
      data: { 
        nodeType: "expert", 
        label: "Elena Rostova", 
        subtitle: "98% Match • Principal SSE", 
        description: "Elena is a high-confidence expert in distributed architectures, databases, and stream processing. Active in #tech-architecture.",
        isSelected: false
      },
    },
    {
      id: "exp-marcus",
      type: "custom",
      position: { x: 420, y: 10 },
      data: { 
        nodeType: "expert", 
        label: "Marcus Chen", 
        subtitle: "94% Match • Senior DevOps", 
        description: "Marcus specializes in containerization, database clustering, and Kubernetes. Key contributor to vector migration decisions.",
        isSelected: false
      },
    }
  ], []);

  const initialEdges = useMemo(() => [
    { id: "e-elena-tech", source: "exp-elena", target: "chan-tech", animated: true, style: { stroke: "#10b981", strokeWidth: 1.5 } },
    { id: "e-marcus-ai", source: "exp-marcus", target: "chan-ai", animated: true, style: { stroke: "#10b981", strokeWidth: 1.5 } },
    { id: "e-tech-core", source: "chan-tech", target: "proj-core", style: { stroke: "#6366f1", strokeWidth: 1.8 } },
    { id: "e-ai-core", source: "chan-ai", target: "proj-core", style: { stroke: "#6366f1", strokeWidth: 1.8 } },
    { id: "e-core-dec15", source: "proj-core", target: "dec-015", animated: true, style: { stroke: "#f59e0b", strokeWidth: 1.5 } },
    { id: "e-core-dec14", source: "proj-core", target: "dec-014", animated: true, style: { stroke: "#f59e0b", strokeWidth: 1.5 } },
    { id: "e-elena-dec15", source: "chan-tech", target: "dec-015", style: { stroke: "#a855f7", strokeWidth: 1.2, strokeDasharray: "4 4" } },
    { id: "e-marcus-dec14", source: "chan-ai", target: "dec-014", style: { stroke: "#a855f7", strokeWidth: 1.2, strokeDasharray: "4 4" } }
  ], []);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Load dynamically generated decisions and experts from Claude
  useEffect(() => {
    async function loadDynamicGraphElements() {
      try {
        const response = await fetch("/api/decision-replay");
        if (response.ok) {
          const replays = await response.json();
          const newReplays = replays.filter((r: any) => r.id > 3);
          
          if (newReplays.length > 0) {
            const newNodes: any[] = [];
            const newEdges: any[] = [];
            
            newReplays.forEach((replay: any, index: number) => {
              const replayNodeId = `dec-${replay.id}`;
              
              // 1. Create Decision Node
              newNodes.push({
                id: replayNodeId,
                type: "custom",
                position: { 
                  x: 300 + (index * 240) + (Math.random() - 0.5) * 60, 
                  y: 420 + (Math.random() - 0.5) * 80 
                },
                data: { 
                  nodeType: "decision", 
                  label: `DEC-${replay.id}: ${replay.title.split(":").pop()?.trim().slice(0, 24)}...`, 
                  subtitle: `Accepted • Just now`, 
                  description: replay.problem_statement,
                  isSelected: false
                },
              });

              // 2. Link decision to Core Project node
              newEdges.push({ 
                id: `e-core-dec-${replay.id}`, 
                source: "proj-core", 
                target: replayNodeId, 
                animated: true, 
                style: { stroke: "#f59e0b", strokeWidth: 1.5 } 
              });

              // 3. Link participants to decision node as well
              replay.participants.forEach((person: string, pIdx: number) => {
                const expNodeId = `exp-${person.toLowerCase().replace(/\s+/g, "-")}`;
                
                // If expert doesn't exist in original initialNodes, create a node for them
                const expertExists = initialNodes.some(n => n.id === expNodeId);
                const alreadyAddedNode = newNodes.some(n => n.id === expNodeId);
                
                if (!expertExists && !alreadyAddedNode) {
                  newNodes.push({
                    id: expNodeId,
                    type: "custom",
                    position: { 
                      x: 100 + (pIdx * 190) + (Math.random() - 0.5) * 40, 
                      y: -120 - (index * 90) 
                    },
                    data: { 
                      nodeType: "expert", 
                      label: person, 
                      subtitle: "94% Match • Dynamic Domain", 
                      description: `${person} was extracted as a high-confidence expert contributor during live discussion analysis.`,
                      isSelected: false
                    },
                  });
                }

                // Link Expert to Decision Node
                newEdges.push({
                  id: `e-${expNodeId}-dec-${replay.id}`,
                  source: expNodeId,
                  target: replayNodeId,
                  style: { stroke: "#10b981", strokeWidth: 1.2, strokeDasharray: "4 4" }
                });
              });
            });

            setNodes((prevNodes) => {
              const existingIds = new Set(prevNodes.map(n => n.id));
              const uniqueNewNodes = newNodes.filter(n => !existingIds.has(n.id));
              return [...prevNodes, ...uniqueNewNodes];
            });
            setEdges((prevEdges) => {
              const existingIds = new Set(prevEdges.map(e => e.id));
              const uniqueNewEdges = newEdges.filter(e => !existingIds.has(e.id));
              return [...prevEdges, ...uniqueNewEdges];
            });
          }
        }
      } catch (err) {
        console.error("Failed to dynamically load memory graph elements:", err);
      }
    }
    loadDynamicGraphElements();

    const pollInterval = setInterval(() => {
      loadDynamicGraphElements();
    }, 3500);

    return () => clearInterval(pollInterval);
  }, [setNodes, setEdges, initialNodes]);

  // Filter nodes based on search query
  useEffect(() => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        const matchesSearch = 
          searchQuery === "" ||
          node.data.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          node.data.nodeType.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (node.data.subtitle && node.data.subtitle.toLowerCase().includes(searchQuery.toLowerCase()));

        return {
          ...node,
          style: {
            ...node.style,
            opacity: matchesSearch ? 1 : 0.25,
            transition: "opacity 0.2s ease-in-out",
          },
        };
      })
    );
  }, [searchQuery, setNodes]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  // Handle node selection to open details panel
  const onNodeClick = useCallback(
    (_: any, node: any) => {
      setSelectedNode(node);
      setNodes((prevNodes) =>
        prevNodes.map((n) => ({
          ...n,
          data: {
            ...n.data,
            isSelected: n.id === node.id,
          },
        }))
      );
    },
    [setNodes]
  );

  // Deselect node and close panel
  const handleClosePanel = () => {
    setSelectedNode(null);
    setNodes((prevNodes) =>
      prevNodes.map((n) => ({
        ...n,
        data: {
          ...n.data,
          isSelected: false,
        },
      }))
    );
  };

  // Add custom node dynamically to show rich interactivity
  const handleAddNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeLabel) return;

    const id = `custom-${Date.now()}`;
    const newNode = {
      id,
      type: "custom",
      // Random coordinates near center
      position: { 
        x: 200 + Math.random() * 200, 
        y: 100 + Math.random() * 200 
      },
      data: {
        nodeType: newNodeType,
        label: newNodeLabel,
        subtitle: newNodeSubtitle || "Captured dynamically",
        description: newNodeDesc || "A custom synthesized element added interactively to the Memory Graph.",
        isSelected: false
      }
    };

    setNodes((prev) => [...prev, newNode]);

    // Automatically link to core project
    const newEdge: Edge = {
      id: `e-${id}-core`,
      source: "proj-core",
      target: id,
      animated: true,
      style: { stroke: "#6366f1", strokeWidth: 1.5, strokeDasharray: "2 2" }
    };
    setEdges((prev) => [...prev, newEdge]);

    // Reset Form
    setNewNodeLabel("");
    setNewNodeSubtitle("");
    setNewNodeDesc("");
  };

  // Delete dynamic node
  const handleDeleteNode = (id: string) => {
    setNodes((prev) => prev.filter((n) => n.id !== id));
    setEdges((prev) => prev.filter((e) => e.source !== id && e.target !== id));
    if (selectedNode?.id === id) {
      setSelectedNode(null);
    }
  };

  return (
    <div id="memory-graph-container" className="space-y-6 flex flex-col h-full min-h-[calc(100vh-140px)]">
      {/* Professional sub-header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-900 pb-5">
        <div>
          <h2 className="text-xl font-sans font-semibold text-zinc-900 dark:text-zinc-50">Memory Graph Explorer</h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">Inspect the automatic multi-dimensional relationship graph synthesized from communication signals.</p>
        </div>
        <div className="flex items-center space-x-3 text-xs font-mono">
          <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/20 text-zinc-600 dark:text-zinc-400 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
            <span>{nodes.length} Active Nodes</span>
          </span>
          <span className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/20 text-zinc-600 dark:text-zinc-400 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>{edges.length} Relation Edges</span>
          </span>
        </div>
      </div>

      {/* Graph Toolbar/Filters */}
      <div id="graph-filters" className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
          <input 
            type="text" 
            placeholder="Search nodes, channels, decisions, or experts..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900/30 border border-zinc-200 dark:border-zinc-900 rounded-lg text-xs font-sans text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 focus:outline-none focus:border-zinc-300 dark:focus:border-zinc-800 focus:ring-1 focus:ring-zinc-200 dark:focus:ring-zinc-800 transition-all shadow-xs"
          />
        </div>
        <div className="flex items-center space-x-2">
          {/* Legend indicators */}
          <div className="hidden lg:flex items-center space-x-3 bg-zinc-100 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-900 px-3 py-1.5 rounded-lg text-[10px] font-mono text-zinc-500">
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Project</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-purple-500" /> Channel</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Decision</span>
            <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Expert</span>
          </div>
        </div>
      </div>

      {/* Main Graph Content Split Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 items-stretch">
        
        {/* Interactive React Flow Canvas */}
        <div className="lg:col-span-3 border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950/40 rounded-xl h-[560px] relative overflow-hidden shadow-xs group flex flex-col">
          <div className="absolute top-3 left-3 z-10 pointer-events-none select-none flex flex-col">
            <span className="text-[10px] font-mono font-bold text-zinc-400 dark:text-zinc-600">CANVAS INTERACTIVE VIEW</span>
            <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-sans mt-0.5">Drag canvas to pan • Scroll to zoom • Click nodes to inspect</span>
          </div>

          <div className="flex-1 w-full h-full relative" id="react-flow-wrapper">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              nodeTypes={nodeTypes}
              fitView
              attributionPosition="bottom-right"
              className="text-zinc-800 dark:text-zinc-100"
            >
              <Background color="#ccc" gap={16} size={1} className="dark:opacity-10 opacity-30" />
              <Controls className="!bg-white dark:!bg-zinc-900 !border-zinc-200 dark:!border-zinc-800 shadow-sm" />
              <MiniMap 
                nodeStrokeColor={(n) => {
                  if (n.data?.nodeType === "project") return "#6366f1";
                  if (n.data?.nodeType === "channel") return "#a855f7";
                  if (n.data?.nodeType === "decision") return "#f59e0b";
                  if (n.data?.nodeType === "expert") return "#10b981";
                  return "#9ca3af";
                }}
                nodeColor={(n) => {
                  return "transparent";
                }}
                nodeBorderRadius={8}
                maskColor="rgba(0, 0, 0, 0.15)"
                className="!bg-white dark:!bg-zinc-900 !border-zinc-200 dark:!border-zinc-850 shadow-md rounded-lg overflow-hidden"
              />
            </ReactFlow>
          </div>
        </div>

        {/* Details Side Panel & Dynamic Interaction Form */}
        <div className="flex flex-col space-y-6">
          
          {/* Node Inspect panel */}
          <div className="border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/40 rounded-xl p-5 shadow-xs flex-1 flex flex-col justify-between min-h-[260px]">
            {selectedNode ? (
              <div className="space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase ${
                        selectedNode.data.nodeType === "project" ? "bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/40" :
                        selectedNode.data.nodeType === "channel" ? "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-100 dark:border-purple-900/40" :
                        selectedNode.data.nodeType === "decision" ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/40" :
                        "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40"
                      }`}>
                        {selectedNode.data.nodeType}
                      </span>
                      <h4 className="font-sans font-semibold text-sm text-zinc-900 dark:text-zinc-100 mt-1.5 leading-tight">{selectedNode.data.label}</h4>
                      {selectedNode.data.subtitle && (
                        <p className="text-[10px] font-mono text-zinc-500 mt-0.5">{selectedNode.data.subtitle}</p>
                      )}
                    </div>
                    <button 
                      onClick={handleClosePanel}
                      className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-1 rounded hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      title="Clear selection"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <hr className="border-zinc-100 dark:border-zinc-900" />

                  <div className="space-y-3">
                    <div>
                      <h5 className="text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">captured content</h5>
                      <p className="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed mt-1 font-sans">
                        {selectedNode.data.description || "No captured metadata matches this synthesized node profile."}
                      </p>
                    </div>

                    <div>
                      <h5 className="text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">cohesion metrics</h5>
                      <div className="grid grid-cols-2 gap-2 mt-1.5">
                        <div className="bg-zinc-50 dark:bg-zinc-950/50 p-2 rounded-lg border border-zinc-100 dark:border-zinc-900 text-left">
                          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono uppercase">COHESION RATING</p>
                          <p className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">EXCELLENT</p>
                        </div>
                        <div className="bg-zinc-50 dark:bg-zinc-950/50 p-2 rounded-lg border border-zinc-100 dark:border-zinc-900 text-left">
                          <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-mono uppercase">CONFIDENCE</p>
                          <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 mt-0.5">96% Conf.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-100 dark:border-zinc-900 flex flex-col gap-2">
                  {selectedNode.id.startsWith("custom-") && (
                    <button 
                      onClick={() => handleDeleteNode(selectedNode.id)}
                      className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 border border-rose-200 dark:border-rose-900/30 text-rose-600 hover:text-white dark:text-rose-400 bg-transparent hover:bg-rose-600 dark:hover:bg-rose-900/30 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Dynamic Node</span>
                    </button>
                  )}
                  <button className="w-full flex items-center justify-center space-x-1.5 px-3 py-2 bg-zinc-900 hover:bg-zinc-850 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-lg text-xs font-medium transition-colors shadow-sm">
                    <span>Reconstruct Source Signal</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-8 space-y-3 h-full">
                <div className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center border border-zinc-100 dark:border-zinc-900 text-zinc-400">
                  <Info className="w-5 h-5 text-indigo-500/80 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Inspect Node Signal</p>
                  <p className="text-[10px] text-zinc-400 max-w-[180px] leading-relaxed mx-auto">
                    Click any node in the constellation graph to load its structured SaaS trail, expert scores, or pending ADR dependency links.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Interactive: Add Node Form to show real React interactivity */}
          <div className="border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-900/40 rounded-xl p-5 shadow-xs">
            <div className="flex items-center space-x-2 mb-3">
              <Layers className="w-4 h-4 text-indigo-500" />
              <h4 className="font-sans font-semibold text-xs text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">Synthesize Node</h4>
            </div>
            
            <form onSubmit={handleAddNode} className="space-y-2.5">
              <div>
                <label className="text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase">Node Title</label>
                <input 
                  type="text" 
                  value={newNodeLabel}
                  onChange={(e) => setNewNodeLabel(e.target.value)}
                  placeholder="e.g. DEC-016: Redis Deprecate"
                  className="w-full mt-0.5 px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-md text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-zinc-300 dark:focus:border-zinc-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase">Node Type</label>
                  <select 
                    value={newNodeType}
                    onChange={(e) => setNewNodeType(e.target.value as any)}
                    className="w-full mt-0.5 px-2 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-md text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
                  >
                    <option value="decision">Decision</option>
                    <option value="expert">Expert</option>
                    <option value="channel">Channel</option>
                    <option value="project">Project</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase">Sub-label</label>
                  <input 
                    type="text" 
                    value={newNodeSubtitle}
                    onChange={(e) => setNewNodeSubtitle(e.target.value)}
                    placeholder="e.g. Proposed • Today"
                    className="w-full mt-0.5 px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-md text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-mono font-bold text-zinc-400 dark:text-zinc-500 uppercase">Description / Context</label>
                <textarea 
                  value={newNodeDesc}
                  onChange={(e) => setNewNodeDesc(e.target.value)}
                  placeholder="Summary of this organizational knowledge component..."
                  rows={2}
                  className="w-full mt-0.5 px-2.5 py-1.5 bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-900 rounded-md text-xs text-zinc-800 dark:text-zinc-200 focus:outline-none resize-none"
                />
              </div>

              <button 
                type="submit"
                className="w-full flex items-center justify-center space-x-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition-all shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Inject to Constellation</span>
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}
