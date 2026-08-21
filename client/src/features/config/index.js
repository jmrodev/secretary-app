
// Public API for the Config Feature
// Handles system preferences, integrations and administrative settings

// Controllers & Hooks
export { useSystemConfigController } from '@/features/config/hooks/useSystemConfigController';

// Components
export { SystemConfigPage } from '@/features/config/SystemConfigPage';
export { GeneralSettings } from '@/features/config/components/sections/GeneralSettings';
export { ModulesSettings } from '@/features/config/components/sections/ModulesSettings';
export { CommunicationSettings } from '@/features/config/components/sections/CommunicationSettings';
export { IntegrationSettings } from '@/features/config/components/sections/IntegrationSettings';
export { BillingSettings } from '@/features/config/components/sections/BillingSettings';
export { ConfigToggle } from '@/features/config/components/ui/ConfigToggle';
export { ConfigField } from '@/features/config/components/ui/ConfigField';
export { MessageTemplateEditor } from '@/features/config/components/forms/MessageTemplateEditor';
