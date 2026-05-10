
// Public API for the Config Feature
// Handles system preferences, integrations and administrative settings

// Controllers & Hooks
export { useSystemConfigController } from '@/features/config/hooks/useSystemConfigController';

// Components
export { default as SystemConfigPage } from '@/features/config/SystemConfigPage';
export { default as GeneralSettings } from '@/features/config/components/sections/GeneralSettings';
export { default as CommunicationSettings } from '@/features/config/components/sections/CommunicationSettings';
export { default as IntegrationSettings } from '@/features/config/components/sections/IntegrationSettings';
export { default as BillingSettings } from '@/features/config/components/sections/BillingSettings';
export { default as ConfigToggle } from '@/features/config/components/ui/ConfigToggle';
export { default as ConfigField } from '@/features/config/components/ui/ConfigField';
export { default as MessageTemplateEditor } from '@/features/config/components/forms/MessageTemplateEditor';
