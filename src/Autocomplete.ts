"use strict"

import * as vscode from 'vscode'
import L4RCApiData from "./ApiData"
import { getLastMatch, keys, assign } from "./utils"

const wordsRegex = /([\w\[\]]+\.[\w\[\]\.]*)/g

export class L4RCAutocomplete implements vscode.CompletionItemProvider {
    constructor(private apiData: L4RCApiData) { }

    public provideCompletionItems(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): Thenable<vscode.CompletionItem[]> {
        return new Promise<vscode.CompletionItem[]>((resolve, reject) => {
            let lineText = document.lineAt(position.line).text
            let lineTillCurrentPosition = lineText.substr(0, position.character)

            let match = getLastMatch(wordsRegex, lineTillCurrentPosition)
            let line = match ? match[1] : ""

            let words = line.split(".")
            words.pop()

            let type = this.apiData.findType(words)

            if (!type || !type.properties) {
                return reject()
            }

            let suggestions = this.toCompletionItems(type.properties)
            return resolve(suggestions)
        })
    }

    private toCompletionItems(types: L4RCTypeMap): vscode.CompletionItem[] {
        return keys(types).map(key => this.toCompletionItem(types[key], <string>key))
    }

    private toCompletionItem(type: L4RCType, key: string): vscode.CompletionItem {
        const { doc, name, mode } = type

        let completionItem = assign(new vscode.CompletionItem(key), {
            detail: "(property) " + key + ": " + type.type,
            documentation: new vscode.MarkdownString(["**"+name+"**", doc, mode].filter(Boolean).join("\n\n")),
            kind: vscode.CompletionItemKind.Property,
            filterText: key + " " + name
        })

        if (type.type === "function") {
            assign(completionItem, {
                detail: "(function) " + name + "("+ Object.keys(type.args).join(", ") + "): " + type.returns,
                kind: vscode.CompletionItemKind.Function,
                documentation: new vscode.MarkdownString([doc, mode].filter(Boolean).join("\n\n")),
            })
        }
        else if (type.type === "field") {
            assign(completionItem, {
                detail: "(field) " + name,
                kind: vscode.CompletionItemKind.Field,
            })
        }
        else if (type.type === "class") {
            assign(completionItem, {
                detail: "(class) " + name,
                kind: vscode.CompletionItemKind.Class,
            })
        }
        else if (type.type === "define") {
            assign(completionItem, {
                detail: "(constant) " + type.type,
                kind: vscode.CompletionItemKind.Constant
            })
        }

        return completionItem
    }
}
