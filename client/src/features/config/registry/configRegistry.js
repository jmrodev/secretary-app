import React from 'react';

/**
 * Registry for System Configuration sections.
 * Allows other features to plug into the settings page without direct imports in SystemConfigPage.
 */
const registry = new Map();

export const registerConfigSection = (id, metadata, Component) => {
    registry.set(id, { metadata, Component });
};

export const getConfigSections = () => Array.from(registry.entries()).map(([id, data]) => ({ id, ...data }));

export const getConfigSection = (id) => registry.get(id);

// Default sections can be registered here or in their respective features if we had a startup/init phase.
// For now, to minimize changes while achieving decoupling, we will expose this registry.
