# Traduções para GroupSesh

Este diretório contém arquivos de tradução para o GroupSesh, permitindo que a aplicação seja acessível em vários idiomas.

## Idiomas Suportados

- Inglês (en) - Idioma padrão
- Português (Portugal) (pt-pt)
- Português (Brasil) (pt-br)
- Espanhol (es)
- Alemão (de)
- Francês (fr)
- Italiano (it)

## Como Gerenciar Traduções

### Extrair Strings para Tradução

Para extrair as strings marcadas para tradução dos arquivos Python e templates:

```bash
pybabel extract -F babel.cfg -k _l -o translations/messages.pot .
```

### Iniciar uma Nova Tradução

Para criar arquivos de tradução para um novo idioma:

```bash
pybabel init -i translations/messages.pot -d translations -l [CÓDIGO_IDIOMA]
```

Por exemplo, para italiano:

```bash
pybabel init -i translations/messages.pot -d translations -l it
```

### Atualizar Traduções Existentes

Para atualizar os arquivos de tradução existentes com novas strings:

```bash
pybabel update -i translations/messages.pot -d translations
```

### Compilar Traduções

Após editar os arquivos .po, compile-os para que a aplicação possa usá-los:

```bash
pybabel compile -d translations
```

## Formato dos Arquivos de Tradução

Os arquivos de tradução seguem o formato gettext PO:

- **messages.pot**: Template de tradução com todas as strings extraídas
- **translations/[IDIOMA]/LC_MESSAGES/messages.po**: Arquivo de tradução para cada idioma
- **translations/[IDIOMA]/LC_MESSAGES/messages.mo**: Arquivo compilado usado pela aplicação

## Como Marcar Strings para Tradução

### Em arquivos Python:

```python
from flask_babel import _

# String simples
flash(_('Mensagem de sucesso'))

# String com parâmetros
flash(_('Olá, %(name)s', name=user.name))
```

### Em templates Jinja2:

```html
<!-- String simples -->
<h1>{{ _('Título da Página') }}</h1>

<!-- Com pluralização -->
<p>{{ ngettext('%(count)d item', '%(count)d items', count) }}</p>
```

## Notas

- Os arquivos .po podem ser editados com editores de texto ou ferramentas específicas como Poedit
- Mantenha as traduções atualizadas à medida que adiciona novas funcionalidades
- Lembre-se de compilar as traduções após editar os arquivos .po