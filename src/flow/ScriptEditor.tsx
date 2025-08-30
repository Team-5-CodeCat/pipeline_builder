import { useState, useEffect } from 'react'
import type { Edge, Node } from 'reactflow'
import type { PipelineNodeData } from './codegen'

export interface ScriptEditorProps {
  nodes: Node<PipelineNodeData>[]
  edges: Edge[]
  onScriptChange: (script: string, type: 'yaml' | 'shell') => void
  onGenerateNodes: (script: string, type: 'yaml' | 'shell') => void
}

export default function ScriptEditor({ nodes, edges, onScriptChange, onGenerateNodes }: ScriptEditorProps) {
  const [activeTab, setActiveTab] = useState<'yaml' | 'shell'>('yaml')
  const [yamlScript, setYamlScript] = useState('')
  const [shellScript, setShellScript] = useState('')
  const [isEditing, setIsEditing] = useState(false)

  // 초기 스크립트 설정
  useEffect(() => {
    if (!isEditing) {
      // 기본 YAML 템플릿
      const defaultYaml = `name: CI/CD Pipeline
on: [push, pull_request]
jobs:
  pipeline:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Run tests
        run: npm test
      - name: Build
        run: npm run build`

      // 기본 Shell 템플릿
      const defaultShell = `#!/bin/bash
set -e

echo "🚀 Starting CI/CD Pipeline"

# Install dependencies
npm ci

# Run tests
npm test

# Build
npm run build

echo "✅ Pipeline completed successfully"`

      setYamlScript(defaultYaml)
      setShellScript(defaultShell)
    }
  }, [isEditing])

  const handleScriptChange = (script: string, type: 'yaml' | 'shell') => {
    if (type === 'yaml') {
      setYamlScript(script)
    } else {
      setShellScript(script)
    }
    onScriptChange(script, type)
  }

  const handleGenerateNodes = () => {
    const currentScript = activeTab === 'yaml' ? yamlScript : shellScript
    onGenerateNodes(currentScript, activeTab)
    setIsEditing(false)
  }

  const handleBoxClick = () => {
    setIsEditing(true)
  }

  const handleBlur = () => {
    // 포커스를 잃었을 때 자동으로 편집 모드 해제
    setTimeout(() => setIsEditing(false), 100)
  }

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid rgba(255,255,255,.15)', 
        paddingBottom: 8, 
        marginBottom: 8 
      }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button 
            onClick={() => setActiveTab('yaml')} 
            style={{ 
              padding: '4px 12px',
              backgroundColor: activeTab === 'yaml' ? '#007acc' : 'rgba(255,255,255,.1)',
              border: '1px solid rgba(255,255,255,.2)',
              borderRadius: '4px',
              color: activeTab === 'yaml' ? 'white' : '#e0e0e0',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            YAML
          </button>
          <button 
            onClick={() => setActiveTab('shell')} 
            style={{ 
              padding: '4px 12px',
              backgroundColor: activeTab === 'shell' ? '#007acc' : 'rgba(255,255,255,.1)',
              border: '1px solid rgba(255,255,255,.2)',
              borderRadius: '4px',
              color: activeTab === 'shell' ? 'white' : '#e0e0e0',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            Shell
          </button>
        </div>
        {isEditing && (
          <button 
            onClick={handleGenerateNodes}
            style={{ 
              padding: '4px 12px',
              backgroundColor: '#007acc',
              border: '1px solid rgba(255,255,255,.2)',
              borderRadius: '4px',
              color: 'white',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            노드 생성
          </button>
        )}
      </div>
      
      <div style={{ flex: 1, overflow: 'auto' }}>
        {isEditing ? (
          <textarea
            value={activeTab === 'yaml' ? yamlScript : shellScript}
            onChange={(e) => handleScriptChange(e.target.value, activeTab)}
            onBlur={handleBlur}
            autoFocus
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#2d2d2d',
              color: '#f0f0f0',
              border: '1px solid rgba(255,255,255,.2)',
              borderRadius: '4px',
              padding: '8px',
              fontFamily: 'monospace',
              fontSize: '12px',
              resize: 'none'
            }}
            placeholder={activeTab === 'yaml' ? 'YAML 스크립트를 입력하세요...' : 'Shell 스크립트를 입력하세요...'}
          />
        ) : (
          <pre 
            onClick={handleBoxClick}
            style={{ 
              whiteSpace: 'pre-wrap', 
              margin: 0,
              padding: '8px',
              backgroundColor: '#2d2d2d',
              borderRadius: '4px',
              fontSize: '12px',
              cursor: 'pointer',
              border: '1px solid transparent',
              transition: 'all 0.2s ease',
              color: '#f0f0f0'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,.4)'
              e.currentTarget.style.backgroundColor = '#3a3a3a'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'transparent'
              e.currentTarget.style.backgroundColor = '#2d2d2d'
            }}
          >
            {activeTab === 'yaml' ? yamlScript : shellScript}
          </pre>
        )}
      </div>
    </div>
  )
}
