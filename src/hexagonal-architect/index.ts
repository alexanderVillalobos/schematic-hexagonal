import {
    Rule,
    Tree,
    SchematicContext,
    apply,
    url,
    applyTemplates,
    move,
    mergeWith,
    chain
} from '@angular-devkit/schematics';
import {strings} from '@angular-devkit/core';
import {join} from 'path';

export function hexagonalArchitect(options: { name: string }): Rule {
    return (tree: Tree, context: SchematicContext) => {
        context.logger.info(`Generando hexagonal para: ${options.name}`);

        // Cargar templates desde dist/hexagonal-architect/files/
        const sourceTemplates = url(join(__dirname, 'files'));

        const source = apply(sourceTemplates, [
            applyTemplates({
                ...options,
                ...strings
            }),
            move(options.name)
        ]);

        return chain([
            mergeWith(source),

            // Fallback: reemplaza manualmente si algo falla
            (tree: Tree) => {
                tree.visit(filePath => {
                    // Solo procesar archivos dentro del folder generado (ej. users/)
                    if (!filePath.startsWith(`/${options.name}/`)) return;
                    // Opcional: solo archivos .ts o .txt
                    if (!filePath.endsWith('.ts') && !filePath.endsWith('.txt')) return;

                    const content = tree.read(filePath)?.toString();
                    if (content?.includes('{{')) {
                        const replaced = content
                            .replace(/{{\s*name\s*}}/g, options.name)
                            .replace(/{{\s*classify name\s*}}/g, strings.classify(options.name))
                            .replace(/{{\s*dasherize name\s*}}/g, strings.dasherize(options.name));
                        tree.overwrite(filePath, replaced);
                        context.logger.info(`→ Placeholder reemplazado en: ${filePath}`);
                    }
                });
                return tree;
            }
        ])(tree, context);
    };
}
