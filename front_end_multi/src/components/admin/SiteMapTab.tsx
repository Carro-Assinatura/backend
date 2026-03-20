import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Home,
  ChevronRight,
  ChevronDown,
  FileText,
  Megaphone,
  UserPlus,
  LayoutDashboard,
  BarChart2,
  FileSpreadsheet,
  Radar,
  Bot,
  UserSearch,
  MessageSquareQuote,
  Settings,
  Users,
  ScrollText,
  LogIn,
  AlertCircle,
  Sparkles,
  Gift,
  Cog,
  Car,
  Quote,
  Phone,
  HelpCircle,
  Layers,
  FolderOpen,
  Globe,
  Lock,
} from "lucide-react";
import { cn } from "@/lib/utils";

export interface SiteMapNode {
  id: string;
  label: string;
  path?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
  children?: SiteMapNode[];
}

/** Organograma: Landing Page como raiz, todas as páginas como ramificações */
const SITE_MAP_ROOT: SiteMapNode = {
  id: "landing",
  label: "Landing Page Inicial",
  path: "/",
  icon: Home,
  children: [
    {
      id: "secoes",
      label: "Seções da Landing",
      icon: Layers,
      children: [
        { id: "hero", label: "Hero", icon: Sparkles },
        { id: "beneficios", label: "Benefícios", icon: Gift },
        { id: "como-funciona", label: "Como Funciona", icon: Cog },
        { id: "comparacao", label: "Comparação", icon: Layers },
        { id: "carros", label: "Carros", icon: Car },
        { id: "depoimentos", label: "Depoimentos", icon: Quote },
        { id: "cta", label: "CTA", icon: Phone },
        { id: "faq", label: "FAQ", icon: HelpCircle },
      ],
    },
    {
      id: "publicas",
      label: "Páginas Públicas",
      icon: Globe,
      children: [
        { id: "cadastro", label: "Cadastro", path: "/cadastro", icon: UserPlus },
        { id: "campanha", label: "Campanha", path: "/campanha", icon: Megaphone },
      ],
    },
    {
      id: "intranet",
      label: "Intranet",
      icon: Lock,
      children: [
        { id: "login", label: "Login", path: "/admin/login", icon: LogIn },
        {
          id: "dashboard",
          label: "Dashboard",
          path: "/admin",
          icon: LayoutDashboard,
          children: [
            { id: "visao-geral", label: "Visão Geral", icon: LayoutDashboard },
            { id: "fin-camp", label: "Fin Camp", path: "/admin/fin-camp", icon: BarChart2 },
          ],
        },
        { id: "planilhas", label: "Planilhas", path: "/admin/spreadsheets", icon: FileSpreadsheet },
        { id: "tracking", label: "Tracking", path: "/admin/tracking", icon: Radar },
        { id: "bot-config", label: "Config Bot", path: "/admin/bot-config", icon: Bot },
        { id: "clientes", label: "Clientes", path: "/admin/clients", icon: UserSearch },
        { id: "depoimentos-admin", label: "Depoimentos", path: "/admin/testimonials", icon: MessageSquareQuote },
        {
          id: "configuracoes",
          label: "Configurações",
          path: "/admin/settings",
          icon: Settings,
          children: [
            { id: "config-geral", label: "Geral", icon: Settings },
            { id: "config-categorias", label: "Categoria de Usuário", icon: Users },
            { id: "config-mapa", label: "Mapa do Site", icon: LayoutDashboard },
          ],
        },
        { id: "usuarios", label: "Usuários", path: "/admin/users", icon: Users },
        { id: "logs", label: "Log", path: "/admin/logs", icon: ScrollText },
      ],
    },
    {
      id: "404",
      label: "Página não encontrada",
      path: "*",
      icon: AlertCircle,
    },
  ],
};

/** Diagrama visual do mapa do site em formato SVG */
function SiteMapDiagram() {
  return (
    <div className="w-full overflow-x-auto py-4">
      <svg
        viewBox="0 0 800 520"
        className="w-full min-w-[600px] max-w-full h-auto"
        style={{ maxHeight: "420px" }}
      >
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8" />
          </marker>
          <linearGradient id="boxGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e0f2e9" />
            <stop offset="100%" stopColor="#f0fdf4" />
          </linearGradient>
        </defs>

        {/* Nó central: Landing Page */}
        <g>
          <rect x="300" y="20" width="200" height="50" rx="8" fill="url(#boxGrad)" stroke="#22c55e" strokeWidth="2" />
          <text x="400" y="52" textAnchor="middle" fill="#166534" fontSize="13" fontWeight="600">
            Landing Page (/)
          </text>
        </g>

        {/* Linhas do centro para os grupos */}
        <line x1="400" y1="70" x2="150" y2="130" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 2" markerEnd="url(#arrowhead)" />
        <line x1="400" y1="70" x2="400" y2="130" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 2" markerEnd="url(#arrowhead)" />
        <line x1="400" y1="70" x2="650" y2="130" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 2" markerEnd="url(#arrowhead)" />
        <line x1="400" y1="70" x2="400" y2="430" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="4 2" markerEnd="url(#arrowhead)" />

        {/* Seções da Landing */}
        <g>
          <rect x="40" y="130" width="220" height="36" rx="6" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1" />
          <text x="150" y="152" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="500">Seções da Landing (scroll)</text>
          <line x1="150" y1="166" x2="80" y2="200" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrowhead)" />
          <line x1="150" y1="166" x2="220" y2="200" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrowhead)" />
          <rect x="20" y="200" width="90" height="24" rx="4" fill="white" stroke="#e2e8f0" strokeWidth="1" />
          <text x="65" y="216" textAnchor="middle" fill="#334155" fontSize="9">Hero, Benefícios</text>
          <rect x="120" y="200" width="90" height="24" rx="4" fill="white" stroke="#e2e8f0" strokeWidth="1" />
          <text x="165" y="216" textAnchor="middle" fill="#334155" fontSize="9">Carros, CTA, FAQ</text>
        </g>

        {/* Páginas Públicas (avulsas) */}
        <g>
          <rect x="290" y="130" width="220" height="36" rx="6" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1" />
          <text x="400" y="152" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="500">Páginas Públicas</text>
          <line x1="350" y1="166" x2="330" y2="200" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrowhead)" />
          <line x1="400" y1="166" x2="400" y2="200" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrowhead)" />
          <line x1="450" y1="166" x2="470" y2="200" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrowhead)" />
          <rect x="280" y="200" width="100" height="36" rx="4" fill="white" stroke="#22c55e" strokeWidth="1.5" />
          <text x="330" y="218" textAnchor="middle" fill="#166534" fontSize="10" fontWeight="500">Cadastro</text>
          <text x="330" y="230" textAnchor="middle" fill="#64748b" fontSize="8">/cadastro</text>
          <rect x="400" y="200" width="100" height="36" rx="4" fill="white" stroke="#22c55e" strokeWidth="1.5" />
          <text x="450" y="218" textAnchor="middle" fill="#166534" fontSize="10" fontWeight="500">Campanha</text>
          <text x="450" y="230" textAnchor="middle" fill="#64748b" fontSize="8">/campanha</text>
        </g>

        {/* Intranet */}
        <g>
          <rect x="540" y="130" width="220" height="36" rx="6" fill="#f1f5f9" stroke="#e2e8f0" strokeWidth="1" />
          <text x="650" y="152" textAnchor="middle" fill="#64748b" fontSize="11" fontWeight="500">Intranet (/admin)</text>
          <line x1="650" y1="166" x2="650" y2="200" stroke="#94a3b8" strokeWidth="1" markerEnd="url(#arrowhead)" />
          <rect x="560" y="200" width="180" height="24" rx="4" fill="white" stroke="#e2e8f0" strokeWidth="1" />
          <text x="650" y="216" textAnchor="middle" fill="#334155" fontSize="9">Login, Dashboard, Planilhas</text>
          <rect x="560" y="230" width="180" height="24" rx="4" fill="white" stroke="#e2e8f0" strokeWidth="1" />
          <text x="650" y="246" textAnchor="middle" fill="#334155" fontSize="9">Clientes, Configurações, Log</text>
        </g>

        {/* Página avulsa: 404 */}
        <g>
          <rect x="330" y="450" width="140" height="40" rx="6" fill="white" stroke="#f87171" strokeWidth="1.5" />
          <text x="400" y="472" textAnchor="middle" fill="#991b1b" fontSize="11" fontWeight="500">Página não encontrada</text>
          <text x="400" y="484" textAnchor="middle" fill="#64748b" fontSize="8">(*) qualquer rota inexistente</text>
        </g>

        {/* Legenda: Páginas avulsas */}
        <g>
          <rect x="40" y="280" width="200" height="50" rx="6" fill="#dcfce7" stroke="#22c55e" strokeWidth="1" strokeDasharray="4 2" />
          <text x="140" y="300" textAnchor="middle" fill="#166534" fontSize="10" fontWeight="600">Páginas avulsas</text>
          <text x="140" y="316" textAnchor="middle" fill="#64748b" fontSize="9">Acesso direto por URL</text>
          <text x="140" y="328" textAnchor="middle" fill="#64748b" fontSize="8">/cadastro, /campanha</text>
        </g>
      </svg>
    </div>
  );
}

function TreeNode({
  node,
  depth,
  expanded,
  onToggle,
}: {
  node: SiteMapNode;
  depth: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const Icon = node.icon ?? FileText;

  const content = (
    <div
      className={cn(
        "flex items-center gap-2 py-2 px-3 rounded-lg transition-colors cursor-pointer",
        "hover:bg-slate-100"
      )}
      onClick={() => hasChildren && onToggle(node.id)}
    >
      {hasChildren ? (
        <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-slate-500">
          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </span>
      ) : (
        <span className="flex-shrink-0 w-5" />
      )}
      <Icon size={18} className="flex-shrink-0 text-slate-600" />
      <span className="text-sm font-medium">{node.label}</span>
      {node.path && !hasChildren && (
        <Link
          to={node.path}
          onClick={(e) => e.stopPropagation()}
          className="ml-auto text-xs text-slate-400 hover:text-accent hover:underline"
        >
          {node.path}
        </Link>
      )}
    </div>
  );

  return (
    <div className={cn("select-none", depth > 0 && "ml-4 border-l-2 border-slate-200 pl-2")}>
      {content}
      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-0">
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

const SiteMapTab = () => {
  const [organogramVisible, setOrganogramVisible] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const handleToggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openNextStage = () => {
    setOrganogramVisible(true);
    setExpanded(new Set(["landing"]));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">Mapa do Site</h2>
        <p className="text-sm text-slate-500 mt-1">
          Diagrama visual do site e organograma detalhado. Clique na imagem para expandir o organograma.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        {/* Diagrama visual do mapa do site em formato imagem */}
        <div className="flex justify-center mb-8">
          <button
            type="button"
            onClick={openNextStage}
            className={cn(
              "w-full max-w-4xl rounded-2xl overflow-hidden transition-all border-2",
              organogramVisible
                ? "border-accent/50 bg-accent/5"
                : "border-slate-200 hover:border-accent/40 hover:shadow-lg"
            )}
          >
            <SiteMapDiagram />
            {!organogramVisible && (
              <div className="py-3 bg-slate-50 border-t border-slate-200 text-center">
                <span className="text-sm text-slate-500 flex items-center justify-center gap-2">
                  <ChevronRight size={16} />
                  Clique para abrir o organograma detalhado
                </span>
              </div>
            )}
          </button>
        </div>

        {/* Organograma das páginas */}
        {organogramVisible && (
          <div className="space-y-1 border-t border-slate-200 pt-6">
            <div className="flex items-center gap-2 mb-4 text-slate-600">
              <FolderOpen size={20} />
              <span className="text-sm font-medium">Organograma das páginas</span>
            </div>
            <TreeNode
              node={SITE_MAP_ROOT}
              depth={0}
              expanded={expanded}
              onToggle={handleToggle}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SiteMapTab;
