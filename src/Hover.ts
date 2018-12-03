"use strict"

import * as vscode from 'vscode'
import L4RCApiData from "./ApiData"
import { getLastMatch } from "./utils"

const { isArray } = Array
const { assign, keys } = Object

const wordsRegex = /([\w\[\]]+\.*[\w\[\]\.]*)/g

export class L4RCHover implements vscode.HoverProvider {
    constructor(private apiData: L4RCApiData) { }

    provideHover(document: vscode.TextDocument, position: vscode.Position, token: vscode.CancellationToken): vscode.ProviderResult<vscode.Hover> {
        return new Promise<vscode.Hover>((resolve, reject) => {
            let lineText = document.lineAt(position.line).text
            let wordRange = document.getWordRangeAtPosition(position)

            if (!wordRange) return reject()

            let lineTillCurrentWord = lineText.substr(0, wordRange.end.character)
            let match = getLastMatch(wordsRegex, lineTillCurrentWord)
            let wordsStr = match ? match[1] : null

            if (!wordsStr) return reject()

            let words = wordsStr.split(".")
            let word = words.pop()
            let type = this.apiData.findType(words)

            if (!type) return reject()

            let target

            if (type.properties && type.properties[word]) {
                target = type.properties[word]
            } else if (type[word]) {
                target = type[word]
            } else if (!target || (!target.type && !target.name)) {
                return reject()
            }

            let content = "```javascript\n(property) " + word + ": " + target.type + "\n```"

            if (target.type === "function") {
                content = "```javascript\n(function) " + target.name + "(" + Object.keys(target.args).join(", ") + "): " + target.returns + "\n```"
            }
            else if (target.type === "field") {
                content = "```javascript\n(field) " + target.name + "\n```"
            }
            else if (target.type === "class") {
                content = "```javascript\n(class) " + target.name + "\n```"
            }
            else if (target.type === "define") {
                content = "```javascript\n(define) " + word + "\n```"
            }


            if (target.name && target.name !== word) {
                content = content + "\n\n" + `**${target.name}**`
            }

            if (target.doc) {
                content += "\n\n" + target.doc
            }

            resolve(new vscode.Hover(content, wordRange))
        })
    }
}
