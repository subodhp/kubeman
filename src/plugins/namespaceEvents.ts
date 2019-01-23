import k8sFunctions from '../k8s/k8sFunctions'
import {ActionGroupSpec, ActionContextType, 
        ActionOutput, ActionOutputStyle, } from '../actions/actionSpec'

const plugin : ActionGroupSpec = {
  context: ActionContextType.Namespace,
  actions: [
    {
      name: "Get Events",
      order: 1,
      autoRefreshDelay: 15,
      
      async act(actionContext) {
        this.onOutput && this.onOutput([[
          ["Event", "LastTimestamp", "(Count)"],
          "Details",
        ]], ActionOutputStyle.TableWithHealth)
        this.showOutputLoading && this.showOutputLoading(true)

        const clusters = actionContext.getClusters()
        const namespaces = actionContext.getNamespaces()
        for(const i in clusters) {
          const output: ActionOutput = []
          const cluster = clusters[i]
          output.push([">Cluster: " + cluster.name, ""])

          for(const j in namespaces) {
            const namespace = namespaces[j]
            if(namespace.cluster.name === cluster.name) {
              output.push([">>Namespace: "+namespace.name, ""])
              const events = await k8sFunctions.getNamespaceEvents(namespace.name, cluster.k8sClient)
              events.forEach(event => {
                if(event.reason === "No Events") {
                  output.push([event.reason])
                } else {
                  output.push([
                    [event.reason, event.lastTimestamp, event.count ? "(" + event.count + ")" : ""],
                    event.type ? [
                      "type: " + event.type,
                      "source: " + event.source,
                      "message: " + event.message,
                    ] : [],
                  ])
                }
              })
            }
          }
          this.onStreamOutput && this.onStreamOutput(output)
        }
        this.showOutputLoading && this.showOutputLoading(false)
      },
      react(actionContext) {
        switch(actionContext.inputText) {
          case "clear": 
            this.onOutput && this.onOutput([[["Event", "LastTimestamp", "(Count)"], "Details"]], ActionOutputStyle.TableWithHealth)
            break
          case "help":
            this.showInfo && this.showInfo('Command Help', [
              "/clear: clears output",
              "/help: shows help"
            ])
            break
          default:
            if(actionContext.inputText && actionContext.inputText.length > 0) {
              this.onOutput && this.onOutput([["Unknown Command"]], ActionOutputStyle.Text)
            }
            break
        }
        actionContext.inputText = undefined
      },
      refresh(actionContext) {
        this.act(actionContext)
      },
    },
  ]
}

export default plugin
