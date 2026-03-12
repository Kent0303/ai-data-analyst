'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Calendar, 
  Lightbulb,
  Target,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';

interface AIReportViewProps {
  report: string;
  onClear: () => void;
}

export default function AIReportView({ report, onClear }: AIReportViewProps) {
  if (!report) return null;

  // 解析报告内容
  const sections = parseReport(report);

  return (
    <Card className="bg-gradient-to-br from-white to-blue-50/30 border-blue-100">
      <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/20 rounded-lg">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-bold">AI 数据分析报告</CardTitle>
            <p className="text-sm text-blue-100 mt-1">智能洞察 · 数据驱动决策</p>
          </div>
        </div>
        <button 
          onClick={onClear}
          className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition-colors"
        >
          清除报告
        </button>
      </CardHeader>
      
      <CardContent className="p-6">
        <div className="space-y-6">
          {sections.map((section, index) => (
            <ReportSection key={index} section={section} index={index} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface Section {
  title: string;
  type: 'summary' | 'metrics' | 'insights' | 'suggestions' | 'default';
  content: string[];
}

function parseReport(report: string): Section[] {
  const lines = report.split('\n');
  const sections: Section[] = [];
  let currentSection: Section | null = null;

  lines.forEach(line => {
    const trimmed = line.trim();
    if (!trimmed) return;

    // 检测标题行
    if (trimmed.startsWith('## ') || trimmed.startsWith('### ')) {
      if (currentSection) {
        sections.push(currentSection);
      }
      const title = trimmed.replace(/^#+\s*/, '');
      const type = detectSectionType(title);
      currentSection = { title, type, content: [] };
    } else if (currentSection) {
      currentSection.content.push(trimmed);
    }
  });

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

function detectSectionType(title: string): Section['type'] {
  const lower = title.toLowerCase();
  if (lower.includes('摘要') || lower.includes('总结') || lower.includes('overview')) {
    return 'summary';
  }
  if (lower.includes('指标') || lower.includes('数据') || lower.includes('metrics')) {
    return 'metrics';
  }
  if (lower.includes('洞察') || lower.includes('发现') || lower.includes('insights')) {
    return 'insights';
  }
  if (lower.includes('建议') || lower.includes('推荐') || lower.includes('suggestions')) {
    return 'suggestions';
  }
  return 'default';
}

function ReportSection({ section, index }: { section: Section; index: number }) {
  const icons = {
    summary: <Target className="w-5 h-5 text-blue-600" />,
    metrics: <BarChart3 className="w-5 h-5 text-green-600" />,
    insights: <Lightbulb className="w-5 h-5 text-yellow-600" />,
    suggestions: <TrendingUp className="w-5 h-5 text-purple-600" />,
    default: <CheckCircle2 className="w-5 h-5 text-gray-600" />
  };

  const colors = {
    summary: 'bg-blue-50 border-blue-200',
    metrics: 'bg-green-50 border-green-200',
    insights: 'bg-yellow-50 border-yellow-200',
    suggestions: 'bg-purple-50 border-purple-200',
    default: 'bg-gray-50 border-gray-200'
  };

  return (
    <div className={`rounded-xl border ${colors[section.type]} p-5`}>
      {/* 章节标题 */}
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-white rounded-lg shadow-sm">
          {icons[section.type]}
        </div>
        <h3 className="text-lg font-bold text-gray-800">{section.title}</h3>
        <Badge variant="secondary" className="ml-auto">
          {index + 1}
        </Badge>
      </div>

      <Separator className="mb-4" />

      {/* 章节内容 */}
      <div className="space-y-3">
        {section.content.map((line, i) => {
          // 检测列表项
          if (line.startsWith('- ') || line.startsWith('• ')) {
            return (
              <div key={i} className="flex items-start gap-3 pl-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2 flex-shrink-0" />
                <p className="text-gray-700 leading-relaxed">
                  {formatContent(line.replace(/^[-•]\s*/, ''))}
                </p>
              </div>
            );
          }
          
          // 检测数字列表
          if (/^\d+\.\s/.test(line)) {
            const num = line.match(/^\d+/)?.[0];
            return (
              <div key={i} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                  {num}
                </div>
                <p className="text-gray-700 leading-relaxed pt-0.5">
                  {formatContent(line.replace(/^\d+\.\s*/, ''))}
                </p>
              </div>
            );
          }

          // 检测重要提示
          if (line.includes('**') || line.includes('注意') || line.includes('重要')) {
            return (
              <div key={i} className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-amber-800 font-medium">
                  {formatContent(line)}
                </p>
              </div>
            );
          }

          // 普通段落
          return (
            <p key={i} className="text-gray-700 leading-relaxed pl-2">
              {formatContent(line)}
            </p>
          );
        })}
      </div>
    </div>
  );
}

// 格式化内容，处理加粗、高亮等
function formatContent(text: string): React.ReactNode {
  // 处理加粗 **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const content = part.slice(2, -2);
      // 检测是否是数字/百分比
      if (/^[\d%.,]+$/.test(content) || /\d+%?/.test(content)) {
        return (
          <span key={i} className="inline-flex items-center px-2 py-0.5 bg-blue-100 text-blue-700 rounded-md font-bold mx-1">
            {content}
          </span>
        );
      }
      return <strong key={i} className="font-bold text-gray-900">{content}</strong>;
    }
    return part;
  });
}
