
// Public API for the Config Feature
// Handles system preferences, integrations and administrative settings

// Controllers & Hooks
export { useSystemConfigController } from './hooks/useSystemConfigController';

// Components
export { default as GeneralSettings } from './components/GeneralSettings';
export { default as CommunicationSettings } from './components/CommunicationSettings';
export { default as IntegrationSettings } from './components/IntegrationSettings';
export { default as BillingSettings } from './components/BillingSettings';
export { default as ConfigToggle } from './components/ConfigToggle';
export { default as ConfigField } from './components/ConfigField';
export { default as MessageTemplateEditor } from './components/MessageTemplateEditor';
