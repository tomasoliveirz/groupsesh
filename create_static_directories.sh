#!/bin/bash
# Script para criar estrutura de diretórios estáticos e copiar recursos

# Definir cores para output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}=============================================${NC}"
echo -e "${BLUE}   Criação de Recursos Estáticos GroupSesh   ${NC}"
echo -e "${BLUE}=============================================${NC}"

# Criar estrutura de diretórios
echo -e "${YELLOW}Criando estrutura de diretórios estáticos...${NC}"
mkdir -p static/img
mkdir -p static/css
mkdir -p static/js

# Verificar se os arquivos CSS já existem
if [ -f "static/css/styles.css" ] && [ -f "static/css/themes.css" ]; then
    echo -e "${GREEN}✓ Arquivos CSS encontrados${NC}"
else
    echo -e "${RED}! Arquivos CSS não encontrados ou incompletos${NC}"
    echo -e "${YELLOW}Certifique-se de que os arquivos CSS estão no local correto:${NC}"
    echo -e "  - static/css/styles.css"
    echo -e "  - static/css/themes.css"
fi

# Verificar se os arquivos JS já existem
if [ -f "static/js/main.js" ] && [ -f "static/js/calendar-utils.js" ]; then
    echo -e "${GREEN}✓ Arquivos JavaScript encontrados${NC}"
else
    echo -e "${RED}! Arquivos JavaScript não encontrados ou incompletos${NC}"
    echo -e "${YELLOW}Certifique-se de que os arquivos JavaScript estão no local correto:${NC}"
    echo -e "  - static/js/main.js"
    echo -e "  - static/js/calendar-utils.js"
fi

# Copiar/criar as imagens SVG
echo -e "${YELLOW}Criando arquivos de imagem essenciais...${NC}"

# Criando favicon.png
echo -e "${YELLOW}Criando favicon.png...${NC}"
cat > static/img/favicon.png << EOF
iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAACXBIWXMAAAsTAAALEwEAmpwYAAAEEUlEQVR4nO2WW0zbZRTAUYNGE01MjI8++qAm+qBPPhinU28JmwwQtpVLgVHY2ApcBgzKJThlXMrKZWMrDArmFhEU44Nx7oJzc5sbwhjbCPRCW8S2UBDc
if [ $? -ne 0 ]; then
    echo -e "${RED}Erro ao criar favicon.png, criando arquivo vazio...${NC}"
    touch static/img/favicon.png
fi

# Criando logo.svg
echo -e "${YELLOW}Criando logo.svg...${NC}"
cat > static/img/logo.svg << EOF
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
  <!-- Background Circle -->
  <circle cx="100" cy="100" r="90" fill="#4F46E5" opacity="0.1"/>
  
  <!-- Calendar Base -->
  <rect x="40" y="50" width="120" height="110" rx="8" fill="#FFFFFF" stroke="#4F46E5" stroke-width="6"/>
  
  <!-- Calendar Header -->
  <rect x="40" y="50" width="120" height="30" rx="8" fill="#4F46E5"/>
  
  <!-- Calendar Grid Lines -->
  <line x1="40" y1="100" x2="160" y2="100" stroke="#E5E7EB" stroke-width="2"/>
  <line x1="40" y1="130" x2="160" y2="130" stroke="#E5E7EB" stroke-width="2"/>
  <line x1="80" y1="80" x2="80" y2="160" stroke="#E5E7EB" stroke-width="2"/>
  <line x1="120" y1="80" x2="120" y2="160" stroke="#E5E7EB" stroke-width="2"/>
  
  <!-- Check Marks -->
  <circle cx="60" cy="115" r="8" fill="#10B981"/>
  <path d="M55 115 L59 119 L65 111" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  
  <circle cx="100" cy="145" r="8" fill="#10B981"/>
  <path d="M95 145 L99 149 L105 141" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  
  <circle cx="140" cy="115" r="8" fill="#10B981"/>
  <path d="M135 115 L139 119 L145 111" stroke="#FFFFFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
  
  <!-- Calendar Pins -->
  <circle cx="50" cy="50" r="3" fill="#F59E0B"/>
  <circle cx="150" cy="50" r="3" fill="#F59E0B"/>
</svg>
EOF

# Criando hero-calendar.svg
echo -e "${YELLOW}Criando hero-calendar.svg...${NC}"
cat > static/img/hero-calendar.svg << EOF
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">
  <!-- Background Shape -->
  <path d="M50 100 Q400 0 750 100 L750 500 Q400 600 50 500 Z" fill="#F3F4F6"/>
  
  <!-- Main Calendar -->
  <rect x="150" y="100" width="500" height="400" rx="16" fill="#FFFFFF" stroke="#4F46E5" stroke-width="5"/>
  
  <!-- Calendar Header -->
  <rect x="150" y="100" width="500" height="80" rx="16" fill="#4F46E5"/>
  <text x="400" y="150" font-family="Arial, sans-serif" font-size="32" font-weight="bold" fill="#FFFFFF" text-anchor="middle">March 2025</text>
  
  <!-- Week Days -->
  <text x="197" y="215" font-family="Arial, sans-serif" font-size="16" fill="#374151" text-anchor="middle">Mon</text>
  <text x="267" y="215" font-family="Arial, sans-serif" font-size="16" fill="#374151" text-anchor="middle">Tue</text>
  <text x="337" y="215" font-family="Arial, sans-serif" font-size="16" fill="#374151" text-anchor="middle">Wed</text>
  <text x="407" y="215" font-family="Arial, sans-serif" font-size="16" fill="#374151" text-anchor="middle">Thu</text>
  <text x="477" y="215" font-family="Arial, sans-serif" font-size="16" fill="#374151" text-anchor="middle">Fri</text>
  <text x="547" y="215" font-family="Arial, sans-serif" font-size="16" fill="#374151" text-anchor="middle">Sat</text>
  <text x="617" y="215" font-family="Arial, sans-serif" font-size="16" fill="#374151" text-anchor="middle">Sun</text>
  
  <!-- Grid Lines -->
  <line x1="232" y1="190" x2="232" y2="500" stroke="#E5E7EB" stroke-width="1"/>
  <line x1="302" y1="190" x2="302" y2="500" stroke="#E5E7EB" stroke-width="1"/>
  <line x1="372" y1="190" x2="372" y2="500" stroke="#E5E7EB" stroke-width="1"/>
  <line x1="442" y1="190" x2="442" y2="500" stroke="#E5E7EB" stroke-width="1"/>
  <line x1="512" y1="190" x2="512" y2="500" stroke="#E5E7EB" stroke-width="1"/>
  <line x1="582" y1="190" x2="582" y2="500" stroke="#E5E7EB" stroke-width="1"/>
  
  <line x1="150" y1="240" x2="650" y2="240" stroke="#E5E7EB" stroke-width="1"/>
  <line x1="150" y1="290" x2="650" y2="290" stroke="#E5E7EB" stroke-width="1"/>
  <line x1="150" y1="340" x2="650" y2="340" stroke="#E5E7EB" stroke-width="1"/>
  <line x1="150" y1="390" x2="650" y2="390" stroke="#E5E7EB" stroke-width="1"/>
  <line x1="150" y1="440" x2="650" y2="440" stroke="#E5E7EB" stroke-width="1"/>
  
  <!-- Date Numbers -->
  <!-- Week 1 -->
  <text x="197" y="265" font-family="Arial, sans-serif" font-size="18" fill="#374151" text-anchor="middle">1</text>
  <text x="267" y="265" font-family="Arial, sans-serif" font-size="18" fill="#374151" text-anchor="middle">2</text>
  <text x="337" y="265" font-family="Arial, sans-serif" font-size="18" fill="#374151" text-anchor="middle">3</text>
  <text x="407" y="265" font-family="Arial, sans-serif" font-size="18" fill="#374151" text-anchor="middle">4</text>
  <text x="477" y="265" font-family="Arial, sans-serif" font-size="18" fill="#374151" text-anchor="middle">5</text>
  <text x="547" y="265" font-family="Arial, sans-serif" font-size="18" fill="#374151" text-anchor="middle">6</text>
  <text x="617" y="265" font-family="Arial, sans-serif" font-size="18" fill="#374151" text-anchor="middle">7</text>
  
  <!-- Week 2 -->
  <text x="197" y="315" font-family="Arial, sans-serif" font-size="18" fill="#374151" text-anchor="middle">8</text>
  <text x="267" y="315" font-family="Arial, sans-serif" font-size="18" fill="#374151" text-anchor="middle">9</text>
  <text x="337" y="315" font-family="Arial, sans-serif" font-size="18" fill="#374151" text-anchor="middle">10</text>
  <text x="407" y="315" font-family="Arial, sans-serif" font-size="18" fill="#374151" text-anchor="middle">11</text>
  <text x="477" y="315" font-family="Arial, sans-serif" font-size="18" fill="#374151" text-anchor="middle">12</text>
  
  <!-- Highlighted Day with Circle -->
  <circle cx="547" cy="315" r="20" fill="#4F46E5" opacity="0.2"/>
  <text x="547" y="315" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#4F46E5" text-anchor="middle">13</text>
  
  <text x="617" y="315" font-family="Arial, sans-serif" font-size="18" fill="#374151" text-anchor="middle">14</text>
  
  <!-- Selected dates -->
  <rect x="382" y="345" width="50" height="40" rx="6" fill="#10B981" opacity="0.2"/>
  <text x="407" y="365" font-family="Arial, sans-serif" font-size="18" font-weight="bold" fill="#10B981" text-anchor="middle">18</text>
</svg>
EOF

# Criando creator.jpg
echo -e "${YELLOW}Criando placeholder para creator.jpg...${NC}"
# Criando um arquivo vazio, já que JPG é binário
touch static/img/creator.jpg

# Criando dashboard-preview.png
echo -e "${YELLOW}Criando placeholder para dashboard-preview.png...${NC}"
# Criando um arquivo vazio, já que PNG é binário
touch static/img/dashboard-preview.png

# Criando 404-illustration.svg e 500-illustration.svg
echo -e "${YELLOW}Criando imagens para páginas de erro...${NC}"
touch static/img/404-illustration.svg
touch static/img/500-illustration.svg

echo -e "${GREEN}✓ Recursos estáticos criados com sucesso!${NC}"
echo -e "${BLUE}=============================================${NC}"
echo -e "${YELLOW}Os seguintes arquivos foram criados:${NC}"
echo -e "- static/img/logo.svg"
echo -e "- static/img/hero-calendar.svg"
echo -e "- static/img/favicon.png"
echo -e "- static/img/creator.jpg (placeholder)"
echo -e "- static/img/dashboard-preview.png (placeholder)"
echo -e "- static/img/404-illustration.svg (placeholder)"
echo -e "- static/img/500-illustration.svg (placeholder)"
echo -e "${BLUE}=============================================${NC}"
echo -e "${YELLOW}Para reiniciar a aplicação, execute:${NC}"
echo -e "${BLUE}flask run${NC}"
echo -e "${BLUE}=============================================${NC}"