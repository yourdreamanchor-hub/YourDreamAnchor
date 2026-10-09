import type { Plugin } from 'payload'

const storageFields = new Set(['prefix', '_objectKey', 'url', 'thumbnailURL', 'sizes'])

/** Runs after the storage adapter so its generated fields keep their hooks and data. */
export const mediaAdmin: Plugin = (config) => ({
  ...config,
  collections: config.collections?.map((collection) =>
    collection.slug !== 'media'
      ? collection
      : {
          ...collection,
          fields: collection.fields.map((field) => {
            if (!('name' in field) || !storageFields.has(field.name)) return field
            const internalField = { ...field }
            internalField.admin = {
              ...internalField.admin,
              hidden: true,
              readOnly: true,
              disableBulkEdit: true,
              disableGroupBy: true,
              disableListColumn: true,
              disableListFilter: true,
            }
            return internalField
          }),
        },
  ),
})
