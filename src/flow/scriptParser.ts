import type { PipelineNodeData } from './codegen'

/**
 * YAML 스크립트를 파싱하여 노드 데이터를 생성
 */
export function parseYAMLToNodes(yamlScript: string): PipelineNodeData[] {
  const nodes: PipelineNodeData[] = []
  
  // Start 노드 추가
  nodes.push({
    kind: 'start',
    label: 'Start'
  })

  const lines = yamlScript.split('\n')
  let currentStep: any = null
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()
    
    // steps 섹션 찾기
    if (line === 'steps:' || line === '- steps:') {
      continue
    }
    
    // step 시작
    if (line.startsWith('- name:')) {
      const stepName = line.replace('- name:', '').trim().replace(/['"]/g, '')
      currentStep = { name: stepName }
      continue
    }
    
    // uses 액션 처리
    if (line.startsWith('uses:') && currentStep) {
      const action = line.replace('uses:', '').trim()
      currentStep.action = action
      
      if (action.includes('checkout')) {
        nodes.push({
          kind: 'git_clone',
          label: 'Git Clone',
          repoUrl: 'https://github.com/user/repo.git',
          branch: 'main'
        })
      } else if (action.includes('setup-node')) {
        nodes.push({
          kind: 'prebuild_node',
          label: 'Prebuild Node',
          manager: 'npm'
        })
      } else if (action.includes('setup-python')) {
        nodes.push({
          kind: 'prebuild_python',
          label: 'Prebuild Python'
        })
      } else if (action.includes('setup-java')) {
        nodes.push({
          kind: 'prebuild_java',
          label: 'Prebuild Java'
        })
      }
      continue
    }
    
    // run 명령어 처리
    if (line.startsWith('run:') && currentStep) {
      const command = line.replace('run:', '').trim()
      currentStep.command = command
      
      if (command.includes('npm ci') || command.includes('npm install')) {
        nodes.push({
          kind: 'prebuild_node',
          label: 'Install Dependencies',
          manager: 'npm'
        })
      } else if (command.includes('npm test') || command.includes('yarn test')) {
        nodes.push({
          kind: 'run_tests',
          label: 'Run Tests',
          testType: 'unit',
          command: command
        })
      } else if (command.includes('npm run build') || command.includes('yarn build')) {
        nodes.push({
          kind: 'build_npm',
          label: 'Build NPM'
        })
      } else if (command.includes('docker build')) {
        nodes.push({
          kind: 'docker_build',
          label: 'Docker Build',
          dockerfile: 'Dockerfile',
          tag: 'myapp:latest'
        })
      } else if (command.includes('deploy') || command.includes('kubectl')) {
        nodes.push({
          kind: 'deploy',
          label: 'Deploy',
          environment: 'production',
          deployScript: command
        })
      } else {
        // 커스텀 명령어
        nodes.push({
          kind: 'prebuild_custom',
          label: currentStep.name || 'Custom Command',
          script: command
        })
      }
      
      currentStep = null
      continue
    }
    
    // 멀티라인 run 블록 처리
    if (line === 'run: |' && currentStep) {
      let commandLines: string[] = []
      let j = i + 1
      
      while (j < lines.length) {
        const nextLine = lines[j]
        if (nextLine.trim() === '' || !nextLine.startsWith(' ')) {
          break
        }
        commandLines.push(nextLine.trim())
        j++
      }
      
      const command = commandLines.join('\n')
      currentStep.command = command
      
      if (command.includes('npm ci') || command.includes('npm install')) {
        nodes.push({
          kind: 'prebuild_node',
          label: 'Install Dependencies',
          manager: 'npm'
        })
      } else if (command.includes('npm test') || command.includes('yarn test')) {
        nodes.push({
          kind: 'run_tests',
          label: 'Run Tests',
          testType: 'unit',
          command: command
        })
      } else if (command.includes('npm run build') || command.includes('yarn build')) {
        nodes.push({
          kind: 'build_npm',
          label: 'Build NPM'
        })
      } else if (command.includes('docker build')) {
        nodes.push({
          kind: 'docker_build',
          label: 'Docker Build',
          dockerfile: 'Dockerfile',
          tag: 'myapp:latest'
        })
      } else if (command.includes('deploy') || command.includes('kubectl')) {
        nodes.push({
          kind: 'deploy',
          label: 'Deploy',
          environment: 'production',
          deployScript: command
        })
      } else {
        nodes.push({
          kind: 'prebuild_custom',
          label: currentStep.name || 'Custom Command',
          script: command
        })
      }
      
      currentStep = null
      i = j - 1
    }
  }
  
  return nodes
}

/**
 * Shell 스크립트를 파싱하여 노드 데이터를 생성
 */
export function parseShellToNodes(shellScript: string): PipelineNodeData[] {
  const nodes: PipelineNodeData[] = []
  
  // Start 노드 추가
  nodes.push({
    kind: 'start',
    label: 'Start'
  })

  const lines = shellScript.split('\n')
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    
    // 주석이나 빈 줄 건너뛰기
    if (trimmedLine === '' || trimmedLine.startsWith('#')) {
      continue
    }
    
    // shebang 건너뛰기
    if (trimmedLine.startsWith('#!/')) {
      continue
    }
    
    // set 명령어 건너뛰기
    if (trimmedLine.startsWith('set ')) {
      continue
    }
    
    // echo 명령어는 건너뛰기 (로깅용)
    if (trimmedLine.startsWith('echo ')) {
      continue
    }
    
    // git clone
    if (trimmedLine.includes('git clone')) {
      const repoMatch = trimmedLine.match(/git clone.*?([^\s]+\.git)/)
      const branchMatch = trimmedLine.match(/-b\s+([^\s]+)/)
      
      nodes.push({
        kind: 'git_clone',
        label: 'Git Clone',
        repoUrl: repoMatch ? repoMatch[1] : 'https://github.com/user/repo.git',
        branch: branchMatch ? branchMatch[1] : 'main'
      })
      continue
    }
    
    // apt-get install
    if (trimmedLine.includes('apt-get install')) {
      const packages = trimmedLine.match(/apt-get install.*?([^\s]+(?:\s+[^\s]+)*)/)
      nodes.push({
        kind: 'linux_install',
        label: 'Linux Install',
        osPkg: 'apt',
        packages: packages ? packages[1] : 'git curl'
      })
      continue
    }
    
    // npm ci / npm install
    if (trimmedLine.includes('npm ci') || trimmedLine.includes('npm install')) {
      nodes.push({
        kind: 'prebuild_node',
        label: 'Install Dependencies',
        manager: 'npm'
      })
      continue
    }
    
    // yarn install
    if (trimmedLine.includes('yarn install')) {
      nodes.push({
        kind: 'prebuild_node',
        label: 'Install Dependencies',
        manager: 'yarn'
      })
      continue
    }
    
    // pnpm install
    if (trimmedLine.includes('pnpm install')) {
      nodes.push({
        kind: 'prebuild_node',
        label: 'Install Dependencies',
        manager: 'pnpm'
      })
      continue
    }
    
    // pip install
    if (trimmedLine.includes('pip install')) {
      nodes.push({
        kind: 'prebuild_python',
        label: 'Prebuild Python'
      })
      continue
    }
    
    // npm test / yarn test
    if (trimmedLine.includes('npm test') || trimmedLine.includes('yarn test')) {
      nodes.push({
        kind: 'run_tests',
        label: 'Run Tests',
        testType: 'unit',
        command: trimmedLine
      })
      continue
    }
    
    // npm run build / yarn build
    if (trimmedLine.includes('npm run build') || trimmedLine.includes('yarn build')) {
      nodes.push({
        kind: 'build_npm',
        label: 'Build NPM'
      })
      continue
    }
    
    // python setup.py build
    if (trimmedLine.includes('python setup.py build')) {
      nodes.push({
        kind: 'build_python',
        label: 'Build Python'
      })
      continue
    }
    
    // mvn package / gradle build
    if (trimmedLine.includes('mvn package') || trimmedLine.includes('gradle build')) {
      nodes.push({
        kind: 'build_java',
        label: 'Build Java'
      })
      continue
    }
    
    // docker build
    if (trimmedLine.includes('docker build')) {
      const dockerfileMatch = trimmedLine.match(/-f\s+([^\s]+)/)
      const tagMatch = trimmedLine.match(/-t\s+([^\s]+)/)
      
      nodes.push({
        kind: 'docker_build',
        label: 'Docker Build',
        dockerfile: dockerfileMatch ? dockerfileMatch[1] : 'Dockerfile',
        tag: tagMatch ? tagMatch[1] : 'myapp:latest'
      })
      continue
    }
    
    // deploy 관련 명령어
    if (trimmedLine.includes('deploy') || trimmedLine.includes('kubectl') || trimmedLine.includes('./deploy')) {
      nodes.push({
        kind: 'deploy',
        label: 'Deploy',
        environment: 'production',
        deployScript: trimmedLine
      })
      continue
    }
    
    // curl로 슬랙 알림
    if (trimmedLine.includes('curl') && trimmedLine.includes('slack')) {
      nodes.push({
        kind: 'notify_slack',
        label: 'Notify Slack',
        channel: '#deployments',
        message: 'Deployment completed!'
      })
      continue
    }
    
    // 기타 명령어는 커스텀으로 처리
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      nodes.push({
        kind: 'prebuild_custom',
        label: 'Custom Command',
        script: trimmedLine
      })
    }
  }
  
  return nodes
}
