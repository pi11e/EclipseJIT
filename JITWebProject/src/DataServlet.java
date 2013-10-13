

import java.io.IOException;

import javax.servlet.ServletException;
import javax.servlet.ServletOutputStream;
import javax.servlet.annotation.WebServlet;
import javax.servlet.http.HttpServlet;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

import com.sun.jmx.snmp.Timestamp;

import de.tudresden.mg.ebookshelf.data.BaseXController;

/**
 * Servlet implementation class DataServlet
 */
@WebServlet("/DataServlet")
public class DataServlet extends HttpServlet {
	private static final long serialVersionUID = 1L;

	
       
    /**
     * @see HttpServlet#HttpServlet()
     */
    public DataServlet() {
        super();
        // create a singleton instance
        this.getDbController();
        
    }

	/**
	 * @see HttpServlet#doGet(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doGet(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException 
	{
		
		ServletOutputStream out = response.getOutputStream();

		checkDB();
		
		// execute query, expect it in request parameter "query"
		String query = request.getParameter("query");
		
		// allow only XQUERY:
		if(query != null && query.startsWith("XQUERY"))
		{
			//System.out.println(new Timestamp().getDate() +" DataServlet | executing " + query);
			this.getDbController().executeQuery(query, out);	
		}
		else
		{
			System.out.println("Invalid query " + query);
			System.out.println("Only XQUERY allowed (query has to start with the XQUERY keyword).");
			
		}
	}

	/**
	 * @see HttpServlet#doPost(HttpServletRequest request, HttpServletResponse response)
	 */
	protected void doPost(HttpServletRequest request, HttpServletResponse response) throws ServletException, IOException {
		// TODO Auto-generated method stub
	}
	
	
	private void checkDB()
	{
		// important flag: use sample data (MUCH smaller dataset) or not
		boolean useSampleData = false;
		System.out.println(this.getServletContext().getContextPath());
		String pathToXMLData = useSampleData ? this.getServletContext().getRealPath("data/sampleData.xml") : this.getServletContext().getRealPath("data/data.xml");
		
		// creates a server instance IF it is not already running
		if(this.getDbController().createServer(pathToXMLData))
		{
			System.out.println("Creating database ...");
			System.out.println("Database with data from " + pathToXMLData);
			System.out.println("is up and running.");
			System.out.println("WARNING: Please make sure your encoding is set to UTF-8. Verify all special characters are encoded & rendered correctly.");
			
			/*
			 * To set up proper UTF-8 encoding, you need to do two things:
			 * 1. Make sure eclipse encodes all files in the workspace with UTF-8.
			 * 		- open window/preferences in eclipse
			 * 		- look for General/Workspace, then Text Encoding, set this option to UTF-8
			 * 2. Set the integrated tomcat server config to encode all URIs in UTF-8.
			 * 		- when using a tomcat that is integrated into the eclipse IDE, its config file will
			 * 			reside in a "project" in the package explorer called servers
			 * 		- find the name of your server environment there, then open the corresponding server.xml
			 * 		- find the line that defines the HTTP connector on port 8080, it looks like this:
			 *     		<Connector connectionTimeout="20000" port="8080" protocol="HTTP/1.1" redirectPort="8443"/>
			 *     	- add an attribute URIEncoding='UTF-8' to this line, so it looks like this:
			 *         <Connector connectionTimeout="20000" port="8080" protocol="HTTP/1.1" redirectPort="8443" URIEncoding="UTF-8"/>
 

			 */
		}
	}
	
	private BaseXController getDbController()
	{
		// threadsafe implementation of BaseXController instance (singleton)
		return BaseXController.getInstance();
	}

}
