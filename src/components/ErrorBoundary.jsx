import { Component } from 'react'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-[#0A0F14] h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 px-6 text-center">
            <div className="text-4xl">😵</div>
            <div className="text-sm font-semibold text-[#F0F2F5]">页面出错了</div>
            <div className="text-xs text-[#8D949E]">{this.state.error?.message || '未知错误'}</div>
            <button onClick={this.handleRetry} className="px-4 py-2 rounded-lg bg-[#3B82F6] text-white text-sm font-medium">
              点击重试
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
