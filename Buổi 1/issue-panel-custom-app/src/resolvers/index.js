import Resolver from '@forge/resolver';

import { asApp, route } from '@forge/api';


const resolver = new Resolver();



resolver.define('getIssueDetails', async ({ payload, context }) => {

  console.log('--- Backend: Resolver getIssueDetails được gọi! ---');

  const { issueKey } = payload;


  console.log(JSON.stringify({

    level: 'info',

    message: 'getIssueDetails called',

    issueKey,

    accountId: context.accountId

  }));




  const response = await asApp().requestJira(

    route`/rest/api/3/issue/${issueKey}?fields=summary,status,priority,assignee,created`,

    {

      method: 'GET',

      headers: {

        'Accept': 'application/json'

      }

    }

  );

  if (!response.ok) {

    const errorText = await response.text();

    console.log(JSON.stringify({

      level: 'error',

      message: 'Jira API call failed',

      status: response.status,

      issueKey,

      errorText: errorText.substring(0, 200) // Giới hạn để không log quá dài

    }));

    throw new Error(`Không thể tải issue ${issueKey}. Status: ${response.status}`);

  }



  const issue = await response.json();


  const assigneeName = issue.fields.assignee?.displayName ?? 'Chưa được giao';

  const priorityName = issue.fields.priority?.name ?? 'Không xác định';


  return {

    key: issueKey,

    summary: issue.fields.summary,

    status: issue.fields.status.name,

    priority: priorityName,

    assignee: assigneeName,

    created: issue.fields.created, // ISO 8601 string

  };

});



export const handler = resolver.getDefinitions();