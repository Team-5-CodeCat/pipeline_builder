import { useCallback, useState } from 'react'
import './App.css'
import FlowEditor from './flow/FlowEditor'
import OutputPanel from './flow/OutputPanel'
import ScriptEditor from './flow/ScriptEditor'
import type { Edge, Node } from 'reactflow'
import type { PipelineNodeData } from './flow/codegen'
import { parseYAMLToNodes, parseShellToNodes } from './flow/scriptParser'

function App() {
  const [nodes, setNodes] = useState<Node<PipelineNodeData>[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [activePanel, setActivePanel] = useState<'output' | 'script'>('output')

  const handleGraphChange = useCallback((ns: Node<PipelineNodeData>[], es: Edge[]) => {
    setNodes(ns)
    setEdges(es)
  }, [])

  const handleScriptChange = useCallback((script: string, type: 'yaml' | 'shell') => {
    // 스크립트 변경 시 처리 (필요시 로깅 등)
    console.log(`Script changed (${type}):`, script)
  }, [])

  const handleGenerateNodes = useCallback((script: string, type: 'yaml' | 'shell') => {
    try {
      let parsedNodes: PipelineNodeData[]
      
      if (type === 'yaml') {
        parsedNodes = parseYAMLToNodes(script)
      } else {
        parsedNodes = parseShellToNodes(script)
      }
      
      // 전역 함수를 통해 FlowEditor에 노드 생성 요청
      const generateNodesFromScript = (window as { generateNodesFromScript?: (nodes: PipelineNodeData[]) => void }).generateNodesFromScript
      if (generateNodesFromScript) {
        generateNodesFromScript(parsedNodes)
      }
    } catch (error) {
      console.error('Failed to parse script:', error)
      alert('스크립트 파싱에 실패했습니다.')
    }
  }, [])

  return (
    <div style={{ width: '100%', display: 'grid', gridTemplateColumns: '1fr 520px', gap: 16, height: '100vh', padding: 16, boxSizing: 'border-box' }}>
      <div style={{ height: '100%', border: '1px solid rgba(255,255,255,.15)', borderRadius: 8, overflow: 'hidden' }}>
        <FlowEditor onGraphChange={handleGraphChange} onGenerateFromScript={() => {}} />
      </div>
      <div style={{ height: '100%', border: '1px solid rgba(255,255,255,.15)', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid rgba(255,255,255,.15)', 
          padding: 0 
        }}>
          <button 
            onClick={() => setActivePanel('output')}
            style={{ 
              flex: 1,
              padding: 12,
              backgroundColor: activePanel === 'output' ? '#007acc' : 'transparent',
              border: 'none',
              color: activePanel === 'output' ? 'white' : 'inherit',
              fontWeight: activePanel === 'output' ? 700 : 400,
              cursor: 'pointer'
            }}
          >
            Output
          </button>
          <button 
            onClick={() => setActivePanel('script')}
            style={{ 
              flex: 1,
              padding: 12,
              backgroundColor: activePanel === 'script' ? '#007acc' : 'transparent',
              border: 'none',
              color: activePanel === 'script' ? 'white' : 'inherit',
              fontWeight: activePanel === 'script' ? 700 : 400,
              cursor: 'pointer'
            }}
          >
            Script Editor
          </button>
        </div>
        <div style={{ padding: 12, flex: 1, overflow: 'hidden' }}>
          {activePanel === 'output' ? (
            <OutputPanel nodes={nodes} edges={edges} />
          ) : (
            <ScriptEditor 
              nodes={nodes} 
              edges={edges} 
              onScriptChange={handleScriptChange}
              onGenerateNodes={handleGenerateNodes}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default App
