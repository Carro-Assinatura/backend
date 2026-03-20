# Changelog

## [1.1.0] - 2025-03-12

### Novidades
- Dashboard com filtro comparativo (2 meses ou 2 períodos)
- Menu da intranet reorganizado (Dashboard, Comercial, Marketing, Configurações, Log)
- Colunas numéricas em car_prices (franquia_km_mes, prazo_contrato, valor_mensal_locacao)
- Correção na importação Excel: valor monetário respeita vírgula como decimal (ex: R$0,54)
- Fallback para exibir carros do Supabase quando car_source não é legível
- Auto-seleção "Importar" após importação bem-sucedida

### Correções
- RLS: car_source e car_prices acessíveis publicamente
- Parse de valores monetários (BR e US)
- Modelos Disponíveis: suporte a nome_carro, modelo_carro e marca
